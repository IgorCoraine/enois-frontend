import type { QueryClient } from "@tanstack/react-query";

import { SESSION_FLAG_KEY, isSessionKeyEvent } from "./session-key";

let browserQueryClient: QueryClient | null = null;

export function registerBrowserQueryClient(queryClient: QueryClient) {
  if (typeof window === "undefined") return;
  browserQueryClient = queryClient;

  // Entrar, sair ou trocar de conta em outra aba muda quem é o leitor desta. Renovar o token não
  // muda a chave da sessão; o indicador de sessão que aparece ou some cobre sessões sem chave.
  window.addEventListener("storage", (event) => {
    if (event.storageArea !== localStorage) return;
    const sessionFlipped =
      event.key === SESSION_FLAG_KEY && (event.oldValue === null) !== (event.newValue === null);
    if (event.key === null || isSessionKeyEvent(event) || sessionFlipped) {
      void queryClient.resetQueries();
    }
  });
}

export function getBrowserQueryClient() {
  return browserQueryClient;
}

/**
 * Muitas respostas dependem de quem lê (favoritado, dono, seguindo). Trocar de sessão zera a cache
 * inteira: o que é privado some e o que está na tela é buscado de novo com a sessão nova.
 */
export function resetSessionScopedData() {
  void browserQueryClient?.resetQueries();
}
