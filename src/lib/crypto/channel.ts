/**
 * Canal de aplicação: cifra o corpo de requisições nas rotas que o backend exige cifradas.
 *
 * O TLS já protege o caminho inteiro; esta camada existe para o que o TLS não cobre — um
 * intermediário que termina a conexão (CDN/WAF) e enxerga o corpo em claro. O que trafega aqui é a
 * chave efêmera do handshake; a chave simétrica nunca sai dos dois lados.
 *
 * Como funciona, em uma frase: ECDH P-256 gera um segredo, HKDF-SHA256 transforma esse segredo numa
 * chave AES-256-GCM por sessão, e cada requisição leva um envelope
 * `v1:<sessão>:<base64(iv|ciphertext|tag)>` com AAD amarrando método, caminho, timestamp e nonce.
 *
 * Ligado por rota em `VITE_CRYPTO_PATHS` (lista separada por vírgula, ex.: `/auth/login,/me/profile`),
 * e só depois que o mesmo caminho estiver em `rede.crypto.protected-paths` no backend. Vazio (padrão)
 * = nada é cifrado e o comportamento é exatamente o de antes.
 */
import type { ChannelHandshake } from "@/types/application/crypto/channel-handshake";
import type { ChannelSession } from "@/types/application/crypto/channel-session";

import { clientOriginHeader } from "@/lib/api/client-origin";

const VERSION = "v1";

/** Igual ao backend: precisa ser o mesmo literal dos dois lados. */
const HKDF_INFO = "enois-e2e-v1";

/** Renova um pouco antes de vencer, em vez de descobrir no meio de um envio. */
const SESSION_MARGIN_MS = 60_000;

/** Sem expiração legível do servidor, assume curto: um handshake a mais é barato. */
const FALLBACK_TTL_MS = 20 * 60 * 1000;

const BODYLESS = new Set(["GET", "HEAD", "OPTIONS"]);

export class ChannelError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ChannelError";
  }
}

let session: ChannelSession | null = null;
let opening: Promise<ChannelSession> | null = null;

/** Esquece a sessão (o backend recusou: chave expirada, sessão derrubada, etc.). */
export function forgetChannel(): void {
  session = null;
}

/** Rotas configuradas para cifrar neste build. */
export function cryptoPaths(): readonly string[] {
  const raw: string = import.meta.env.VITE_CRYPTO_PATHS ?? "";
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizedPath(path: string): string {
  return path.split("?")[0].split("#")[0];
}

/**
 * Esta requisição deve ir cifrada?
 *
 * Multipart fica de fora: o corpo é montado pelo navegador (boundary) e o envelope não se aplica.
 * A lista aceita `/caminho` ou `METODO /caminho`, igual ao backend.
 */
export function shouldSeal(method: string, path: string, multipart: boolean): boolean {
  if (multipart) return false;
  const upper = method.toUpperCase();
  if (BODYLESS.has(upper)) return false;
  const clean = normalizedPath(path);
  return cryptoPaths().some((entry) => entry === clean || entry === `${upper} ${clean}`);
}

/**
 * Cifra o corpo e devolve o que precisa ir na requisição.
 *
 * @param endpoint URL absoluta do handshake (`<base>/crypto/session`)
 */
export async function sealRequest(input: {
  method: string;
  path: string;
  plaintext: string;
  endpoint: string;
}): Promise<{ body: string; headers: Record<string, string> }> {
  const current = await ensureSession(input.endpoint);
  const nonce = randomId();
  const timestamp = String(Math.floor(Date.now() / 1000));
  const aad = `REQ ${input.method.toUpperCase()} ${normalizedPath(input.path)} ${timestamp} ${nonce}`;
  const sealed = await sealWithKey(current.key, input.plaintext, aad);

  return {
    body: `${VERSION}:${current.id}:${sealed}`,
    headers: {
      "X-Crypto-Session": current.id,
      "X-Crypto-Timestamp": timestamp,
      "X-Crypto-Nonce": nonce,
    },
  };
}

async function ensureSession(endpoint: string): Promise<ChannelSession> {
  if (session && session.expiresAt - Date.now() > SESSION_MARGIN_MS) {
    return session;
  }
  // Abrir canal é uma ida ao servidor; várias requisições ao mesmo tempo esperam a MESMA promessa.
  if (!opening) {
    opening = openSession(endpoint);
  }
  try {
    const opened = await opening;
    session = opened;
    return opened;
  } finally {
    opening = null;
  }
}

async function openSession(endpoint: string): Promise<ChannelSession> {
  const subtle = webCrypto();
  const pair = await subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, false, [
    "deriveBits",
  ]);
  const spki = await subtle.exportKey("spki", pair.publicKey);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...clientOriginHeader() },
      body: JSON.stringify({ clientPublicKey: toBase64(new Uint8Array(spki)) }),
    });
  } catch {
    throw new ChannelError(
      "CRYPTO_HANDSHAKE_FAILED",
      "Não foi possível abrir o canal cifrado. Verifique a conexão e tente de novo.",
    );
  }

  if (!response.ok) {
    throw new ChannelError(
      "CRYPTO_HANDSHAKE_FAILED",
      `Não foi possível abrir o canal cifrado (${response.status}). Tente de novo em instantes.`,
    );
  }

  const handshake = (await response.json().catch(() => null)) as ChannelHandshake | null;
  if (!handshake?.sessionId || !handshake.serverPublicKey) {
    throw new ChannelError(
      "CRYPTO_HANDSHAKE_INVALID",
      "O servidor respondeu ao canal cifrado num formato inesperado.",
    );
  }

  const serverKey = await subtle.importKey(
    "spki",
    fromBase64(handshake.serverPublicKey),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const shared = await subtle.deriveBits({ name: "ECDH", public: serverKey }, pair.privateKey, 256);
  const hkdf = await subtle.importKey("raw", shared, "HKDF", false, ["deriveBits"]);
  const raw = await subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new TextEncoder().encode(handshake.sessionId),
      info: new TextEncoder().encode(HKDF_INFO),
    },
    hkdf,
    256,
  );
  const key = await subtle.importKey("raw", raw, { name: "AES-GCM", length: 256 }, false, [
    "encrypt",
  ]);

  return {
    id: handshake.sessionId,
    key,
    expiresAt: parseExpiry(handshake.expiresAt),
  };
}

async function sealWithKey(key: CryptoKey, plaintext: string, aad: string): Promise<string> {
  const subtle = webCrypto();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: new TextEncoder().encode(aad),
      tagLength: 128,
    },
    key,
    new TextEncoder().encode(plaintext),
  );

  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return toBase64(combined);
}

function parseExpiry(value: string | number | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    // Segundos (alguns serializadores) ou milissegundos.
    return value < 10_000_000_000 ? value * 1000 : value;
  }
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return Date.now() + FALLBACK_TTL_MS;
}

function webCrypto(): SubtleCrypto {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new ChannelError(
      "CRYPTO_UNAVAILABLE",
      "Este navegador não suporta o canal cifrado (WebCrypto indisponível).",
    );
  }
  return crypto.subtle;
}

function randomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}
