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
