import { useEffect, useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import { readAuthHint, syncAuthHint } from "./auth-hint";
import { useCurrentUser } from "./current-user";
import { hasSessionFlag } from "./session";

export function isAuthenticated(): boolean {
  return hasSessionFlag();
}

/**
 * "Estou logado?" para decidir o que desenhar — sem quebrar a hidratação.
 *
 * A sessão vive em cookies HttpOnly da API, que este servidor não enxerga. O primeiro paint usa
 * a pista do cookie `enois_auth` (ver `auth-hint.ts`), que servidor e cliente leem igual — então o
 * HTML já vem com a casca certa e a hidratação não discorda. Logo depois da montagem, o indicador de sessão confirma
 * ou corrige a pista, e a pista é realinhada para a próxima carga.
 */
export function useIsAuthenticated(): boolean {
  const [authenticated, setAuthenticated] = useState(readAuthHint);

  useEffect(() => {
    const hasToken = isAuthenticated();
    syncAuthHint(hasToken);
    setAuthenticated(hasToken);
  }, []);

  return authenticated;
}

export function useAuth() {
  const navigate = useNavigate();
  const token = hasSessionFlag();
  const query = useCurrentUser();

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isAuthenticated: !!token,
    requireAuth: () => {
      if (!token) {
        navigate({ to: "/entrar", search: { tab: "login" } });
        return false;
      }
      return true;
    },
  };
}
