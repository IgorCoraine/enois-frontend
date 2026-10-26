// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, api, clearSession } from "./api-client";

// Mocks das dependências do api-client — substituídos antes do import para
// evitar efeitos colaterais no módulo (document.addEventListener etc.)
vi.mock("./age-required", () => ({
  notifyBirthDateRequired: vi.fn(),
  notifyParentalConsentRequired: vi.fn(),
}));
vi.mock("./api/client-origin", () => ({ clientOriginHeader: () => ({}) }));
vi.mock("./auth-hint", () => ({ clearAuthHint: vi.fn(), setAuthHint: vi.fn() }));
vi.mock("./device-id", () => ({ getDeviceId: () => null }));
vi.mock("./query-client", () => ({ resetSessionScopedData: vi.fn() }));
vi.mock("./session-key", () => ({
  SESSION_FLAG_KEY: "session_active",
  dropSessionKey: vi.fn(),
  renewSessionKey: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EXPIRES_FAR = Date.now() + 3_600_000; // 1h no futuro → não dispara refresh proativo

function buildLocalStorage(overrides: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(overrides));
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear(),
    _store: store,
  };
}

function jsonResponse(status: number, body: unknown = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: `HTTP ${status}`,
    headers: new Map([["content-type", "application/json"]]) as unknown as Record<string, string>,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

// ---------------------------------------------------------------------------
// #183 — sessão preservada quando a operação pós-refresh falha com não-401
// ---------------------------------------------------------------------------

describe("api-client: refresh + retry (#183)", () => {
  let ls: ReturnType<typeof buildLocalStorage>;
  let locationHref: string;

  beforeEach(() => {
    ls = buildLocalStorage({
      session_active: "1",
      session_expires_at: new Date(EXPIRES_FAR).toISOString(),
    });
    locationHref = "";
    vi.stubGlobal("localStorage", ls);
    vi.stubGlobal("window", {
      location: {
        get href() {
          return locationHref;
        },
        set href(v: string) {
          locationHref = v;
        },
      },
      addEventListener: vi.fn(),
    });
    vi.stubGlobal("document", { visibilityState: "visible", addEventListener: vi.fn() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("mantém a sessão quando o retry retorna 403 após renovação bem-sucedida", async () => {
    let callCount = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) return jsonResponse(401); // request original → 401
        if (callCount === 2)
          return jsonResponse(200, {
            // /auth/refresh → renovado
            expiresAt: new Date(EXPIRES_FAR).toISOString(),
            refreshExpiresAt: new Date(EXPIRES_FAR + 86400000).toISOString(),
          });
        return jsonResponse(403, { code: "FORBIDDEN", message: "Sem permissão" }); // retry → 403
      }),
    );

    await expect(api.get("/algum-recurso")).rejects.toMatchObject({
      name: "ApiError",
      status: 403,
      code: "FORBIDDEN",
    });

    // Sessão preservada
    expect(ls.getItem("session_active")).toBe("1");

    // NÃO redirecionou para login
    expect(locationHref).toBe("");
  });

  it("mantém a sessão quando o retry retorna 429 após renovação bem-sucedida", async () => {
    let callCount = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) return jsonResponse(401);
        if (callCount === 2)
          return jsonResponse(200, {
            expiresAt: new Date(EXPIRES_FAR).toISOString(),
            refreshExpiresAt: new Date(EXPIRES_FAR + 86400000).toISOString(),
          });
        return jsonResponse(429, { code: "RATE_LIMITED", message: "Muitas requisições" });
      }),
    );

    await expect(api.get("/algum-recurso")).rejects.toMatchObject({ status: 429 });
    expect(ls.getItem("session_active")).toBe("1");
    expect(locationHref).toBe("");
  });

  it("mantém a sessão quando o retry retorna 500 após renovação bem-sucedida", async () => {
    let callCount = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) return jsonResponse(401);
        if (callCount === 2)
          return jsonResponse(200, {
            expiresAt: new Date(EXPIRES_FAR).toISOString(),
            refreshExpiresAt: new Date(EXPIRES_FAR + 86400000).toISOString(),
          });
        return jsonResponse(500, { message: "Erro interno" });
      }),
    );

    await expect(api.get("/algum-recurso")).rejects.toMatchObject({ status: 500 });
    expect(ls.getItem("session_active")).toBe("1");
    expect(locationHref).toBe("");
  });

  it("encerra a sessão quando o retry também retorna 401 (token novo rejeitado)", async () => {
    let callCount = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) return jsonResponse(401);
        if (callCount === 2)
          return jsonResponse(200, {
            expiresAt: new Date(EXPIRES_FAR).toISOString(),
            refreshExpiresAt: new Date(EXPIRES_FAR + 86400000).toISOString(),
          });
        return jsonResponse(401); // retry também 401 → token realmente morto
      }),
    );

    await expect(api.get("/algum-recurso")).rejects.toMatchObject({
      status: 401,
      code: "SESSION_EXPIRED",
    });

    // Sessão limpa e redirecionamento para login
    expect(ls.getItem("session_active")).toBeNull();
    expect(locationHref).toBe("/entrar?tab=login");
  });

  it("encerra a sessão quando o /auth/refresh retorna 403 (recusa explícita)", async () => {
    let callCount = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) return jsonResponse(401);
        return jsonResponse(403); // refresh recusado explicitamente
      }),
    );

    await expect(api.get("/algum-recurso")).rejects.toMatchObject({ code: "SESSION_EXPIRED" });
    expect(ls.getItem("session_active")).toBeNull();
    expect(locationHref).toBe("/entrar?tab=login");
  });

  it("NÃO encerra a sessão quando /auth/refresh retorna 503 (servidor indisponível)", async () => {
    let callCount = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) return jsonResponse(401);
        return jsonResponse(503); // refresh: servidor indisponível, não recusou
      }),
    );

    await expect(api.get("/algum-recurso")).rejects.toMatchObject({
      code: "SESSION_CHECK_UNAVAILABLE",
    });
    // A sessão não foi encerrada
    expect(ls.getItem("session_active")).toBe("1");
    expect(locationHref).toBe("");
  });
});

// ---------------------------------------------------------------------------
// sanity: ApiError instanceof
// ---------------------------------------------------------------------------

describe("ApiError", () => {
  it("é instância de Error e tem name/status/code", () => {
    const e = new ApiError(422, "VALIDATION", "campo inválido", "/x");
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("ApiError");
    expect(e.status).toBe(422);
    expect(e.code).toBe("VALIDATION");
    expect(e.path).toBe("/x");
  });
});
