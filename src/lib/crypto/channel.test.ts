import type { FakeServer } from "@/types/application/crypto/fake-server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ChannelError, forgetChannel, sealRequest, shouldSeal } from "./channel";

const HKDF_INFO = "enois-e2e-v1";
const encoder = new TextEncoder();

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

/** Servidor de mentira que faz o papel do backend: guarda a chave do cliente e responde o handshake. */
async function fakeServer(): Promise<FakeServer> {
  const pair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, false, [
    "deriveBits",
  ]);
  const spki = new Uint8Array(await crypto.subtle.exportKey("spki", pair.publicKey));
  const server: FakeServer = { privateKey: pair.privateKey, publicKeySpki: spki, calls: 0 };

  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init?: RequestInit) => {
      server.calls++;
      const body = JSON.parse(String(init?.body)) as { clientPublicKey: string };
      server.clientPublicKey = fromBase64(body.clientPublicKey);
      return new Response(
        JSON.stringify({
          sessionId: "sessao-teste",
          serverPublicKey: toBase64(spki),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }),
  );

  return server;
}

/** Reproduz o outro lado: ECDH com a chave do cliente + HKDF, e abre o envelope. */
async function openEnvelope(
  server: FakeServer,
  envelope: string,
  timestamp: string,
  nonce: string,
  method: string,
  path: string,
): Promise<string> {
  const [version, sessionId, payload] = envelope.split(":");
  expect(version).toBe("v1");
  expect(sessionId).toBe("sessao-teste");

  const bytes = fromBase64(payload);
  const iv = bytes.slice(0, 12);
  const ciphertext = bytes.slice(12);

  const clientPublic = await crypto.subtle.importKey(
    "spki",
    server.clientPublicKey!,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const shared = await crypto.subtle.deriveBits(
    { name: "ECDH", public: clientPublic },
    server.privateKey,
    256,
  );
  const hkdf = await crypto.subtle.importKey("raw", shared, "HKDF", false, ["deriveBits"]);
  const raw = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: encoder.encode(sessionId),
      info: encoder.encode(HKDF_INFO),
    },
    hkdf,
    256,
  );
  const key = await crypto.subtle.importKey("raw", raw, { name: "AES-GCM", length: 256 }, false, [
    "decrypt",
  ]);

  const plain = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: encoder.encode(`REQ ${method} ${path} ${timestamp} ${nonce}`),
      tagLength: 128,
    },
    key,
    ciphertext,
  );
  return new TextDecoder().decode(plain);
}

describe("decisao de cifrar por rota", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_CRYPTO_PATHS", "/auth/login,/me/profile,POST /jobs");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("cifra rota da lista e ignora o resto", () => {
    expect(shouldSeal("POST", "/auth/login", false)).toBe(true);
    expect(shouldSeal("PATCH", "/me/profile", false)).toBe(true);
    expect(shouldSeal("POST", "/jobs", false)).toBe(true);
    expect(shouldSeal("POST", "/feed/posts", false)).toBe(false);
  });

  it("nao cifra requisicao sem corpo nem multipart", () => {
    expect(shouldSeal("GET", "/auth/login", false)).toBe(false);
    expect(shouldSeal("OPTIONS", "/auth/login", false)).toBe(false);
    expect(shouldSeal("POST", "/auth/login", true)).toBe(false);
  });

  it("lista vazia desliga o canal", () => {
    vi.stubEnv("VITE_CRYPTO_PATHS", "");
    expect(shouldSeal("POST", "/auth/login", false)).toBe(false);
  });
});

describe("envelope", () => {
  beforeEach(async () => {
    vi.stubEnv("VITE_CRYPTO_PATHS", "/auth/login");
    forgetChannel();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    forgetChannel();
  });

  it("o servidor abre o corpo cifrado com a AAD da requisicao", async () => {
    const server = await fakeServer();
    const plaintext = JSON.stringify({ email: "pessoa@exemplo.invalid", senha: "segredo" });

    const sealed = await sealRequest({
      method: "POST",
      path: "/auth/login",
      plaintext,
      endpoint: "https://api.test/api/crypto/session",
    });

    const aberto = await openEnvelope(
      server,
      sealed.body,
      sealed.headers["X-Crypto-Timestamp"],
      sealed.headers["X-Crypto-Nonce"],
      "POST",
      "/auth/login",
    );
    expect(aberto).toBe(plaintext);
    expect(sealed.body).not.toContain("pessoa@exemplo.invalid");
  });

  it("reaaproveita a sessao e nao repete nonce", async () => {
    const server = await fakeServer();
    const input = {
      method: "POST",
      path: "/auth/login",
      plaintext: "{}",
      endpoint: "https://api.test/api/crypto/session",
    };

    const first = await sealRequest(input);
    const second = await sealRequest(input);

    expect(server.calls).toBe(1);
    expect(first.headers["X-Crypto-Nonce"]).not.toBe(second.headers["X-Crypto-Nonce"]);
    expect(first.body).not.toBe(second.body);
  });

  it("abre um unico canal para requisicoes simultaneas", async () => {
    const server = await fakeServer();
    const input = {
      method: "POST",
      path: "/auth/login",
      plaintext: "{}",
      endpoint: "https://api.test/api/crypto/session",
    };

    await Promise.all([sealRequest(input), sealRequest(input), sealRequest(input)]);

    expect(server.calls).toBe(1);
  });

  it("envelope de uma rota nao abre em outra", async () => {
    const server = await fakeServer();
    const sealed = await sealRequest({
      method: "POST",
      path: "/auth/login",
      plaintext: "{}",
      endpoint: "https://api.test/api/crypto/session",
    });

    await expect(
      openEnvelope(
        server,
        sealed.body,
        sealed.headers["X-Crypto-Timestamp"],
        sealed.headers["X-Crypto-Nonce"],
        "POST",
        "/me/profile",
      ),
    ).rejects.toBeTruthy();
  });

  it("handshake recusado vira erro explicito do canal", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status: 503 })),
    );

    await expect(
      sealRequest({
        method: "POST",
        path: "/auth/login",
        plaintext: "{}",
        endpoint: "https://api.test/api/crypto/session",
      }),
    ).rejects.toBeInstanceOf(ChannelError);
  });
});
