import type { OAuthProvider } from "@/types/application/auth/oauth-provider";

/**
 * Provedores de login social habilitados nesta instalação.
 *
 * Apple está desativado: a entrada social é somente pelo Google. O vínculo de contas lê esta
 * lista para decidir o que pode ser vinculado. Para reativar o Apple, além de incluí-lo aqui é
 * preciso devolver o botão e o ícone em `routes/entrar.tsx` (o histórico tem o código removido).
 */
export const ENABLED_OAUTH_PROVIDERS: readonly OAuthProvider[] = ["GOOGLE", "LINKEDIN", "GITHUB"];

/** Rótulo de exibição de cada provedor conhecido. */
export const OAUTH_PROVIDER_LABELS: Record<OAuthProvider, string> = {
  GOOGLE: "Google",
  APPLE: "Apple",
  LINKEDIN: "LinkedIn",
  GITHUB: "GitHub",
};

/** Provedor reconhecido pelo front (habilitado ou não). */
export function isOAuthProvider(provider: string): provider is OAuthProvider {
  return Object.hasOwn(OAUTH_PROVIDER_LABELS, provider);
}

export function isOAuthProviderEnabled(provider: string): provider is OAuthProvider {
  return (ENABLED_OAUTH_PROVIDERS as readonly string[]).includes(provider);
}

/**
 * Provedores que a tela de entrada pode oferecer AGORA.
 *
 * A lista acima é o que a instalação habilita (build). O Google ainda pode estar DESLIGADO no
 * ambiente em que o app roda: a API diz isso em `/auth/config` e recusa o start do OAuth com 403
 * `OAUTH_PROVIDER_DISABLED`. Oferecer um botão que só pode falhar é pior do que não oferecer — a
 * pessoa clica, leva erro e não entra.
 *
 * Quem manda é a API: enquanto ela não disser que o Google está ligado, o botão não aparece (a
 * mesma regra do captcha, que também só aparece quando a configuração diz que deve). O LinkedIn
 * não tem flag: segue habilitado.
 */
export function availableSocialProviders(googleLoginEnabled: boolean | undefined): OAuthProvider[] {
  if (googleLoginEnabled !== true) {
    return ENABLED_OAUTH_PROVIDERS.filter((provider) => provider !== "GOOGLE");
  }
  return [...ENABLED_OAUTH_PROVIDERS];
}
