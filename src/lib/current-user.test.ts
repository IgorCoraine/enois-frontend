import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentUserId } from "./current-user";

/**
 * O id de quem esta na tela tem de estar disponivel ANTES de `/me` responder.
 *
 * Sem isso, uma tela que le o id por fora da query (sem se inscrever nela) desenhava o
 * "outro participante" errado: na caixa de entrada, cada conversa aparecia com o nome e a foto
 * de quem estava olhando, em vez de quem com quem se conversa.
 */
describe("id de quem esta na tela", () => {
  let valores: Map<string, string>;

  beforeEach(() => {
    valores = new Map<string, string>();
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => valores.get(key) ?? null,
      setItem: (key: string, value: string) => valores.set(key, value),
      removeItem: (key: string) => valores.delete(key),
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("usa o current_user do localStorage enquanto o /me nao respondeu", () => {
    valores.set("session_active", "1");
    valores.set("current_user", JSON.stringify({ id: "user_1", username: "ana", name: "Ana" }));

    expect(getCurrentUserId()).toBe("user_1");
  });

  it("devolve null sem sessao", () => {
    valores.set("current_user", JSON.stringify({ id: "user_1" }));

    expect(getCurrentUserId()).toBeNull();
  });

  it("ignora um current_user corrompido em vez de quebrar a tela", () => {
    valores.set("session_active", "1");
    valores.set("current_user", "{isto nao e json");

    expect(getCurrentUserId()).toBeNull();
  });

  it("ignora um current_user sem id", () => {
    valores.set("session_active", "1");
    valores.set("current_user", JSON.stringify({ username: "ana" }));

    expect(getCurrentUserId()).toBeNull();
  });
});
