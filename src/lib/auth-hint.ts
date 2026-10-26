import { createIsomorphicFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";

/**
 * Pista de "tem sessão" que o servidor consegue ler.
 *
 * Os cookies da sessão são HttpOnly e pertencem ao host da API, que o SSR não enxerga: toda
 * página logada saía do servidor com a casca de visitante (botão "Entrar", sem menu) e trocava
 * para a casca logada depois de hidratar — a tela piscava em toda navegação com recarga. Este
 * cookie diz só "tem sessão" (o valor é `1`, nunca o token): o servidor desenha a casca certa e o
 * cliente hidrata igual.
 *
 * Não autentica nada. A API continua exigindo a sessão (cookie HttpOnly); quem forjar o cookie só
 * vê a casca logada vazia, e o efeito em `useIsAuthenticated` corrige para visitante logo depois.
 */
export const AUTH_HINT_COOKIE = "enois_auth";

/** Dura o mesmo que o refresh token (30 dias), que é até quando a sessão pode se renovar. */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function setAuthHint() {
  if (typeof document === "undefined") return;
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${AUTH_HINT_COOKIE}=1; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

export function clearAuthHint() {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_HINT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function hintInDocumentCookie(): boolean {
  return document.cookie.split("; ").some((part) => part === `${AUTH_HINT_COOKIE}=1`);
}

/**
 * Mantém a pista alinhada com o indicador de sessão local. Cobre quem já estava logado antes do cookie existir
 * e os caminhos que apagam o token direto (sem passar por `clearSession`).
 */
export function syncAuthHint(hasToken: boolean) {
  if (typeof document === "undefined") return;
  if (hasToken && !hintInDocumentCookie()) setAuthHint();
  if (!hasToken && hintInDocumentCookie()) clearAuthHint();
}

/**
 * O cookie como estava quando a página carregou — o mesmo valor que o servidor recebeu na
 * requisição. Fica congelado de propósito: rotas carregadas sob demanda hidratam DEPOIS do
 * primeiro efeito, e o `syncAuthHint` desse efeito pode já ter criado o cookie. Lido na hora, o
 * componente atrasado via "logado" enquanto o HTML do servidor dizia "visitante".
 */
const hintAtPageLoad = typeof document !== "undefined" && hintInDocumentCookie();

/**
 * O que a casca deve supor no primeiro paint. No servidor vem do cookie da requisição; no
 * cliente, do mesmo cookie congelado na carga — por isso servidor e hidratação concordam.
 */
export const readAuthHint = createIsomorphicFn()
  .server(() => getCookie(AUTH_HINT_COOKIE) === "1")
  .client(() => hintAtPageLoad);
