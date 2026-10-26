import { queryOptions, useQuery } from "@tanstack/react-query";

import type { Profile } from "@/types/application/profile/profile";

import { profileApi } from "./api";
import { getBrowserQueryClient } from "./query-client";
import { hasSessionFlag } from "./session";

const CURRENT_USER_QUERY_KEY = ["me"] as const;

export function currentUserQueryOptions() {
  return queryOptions({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: () => profileApi.me(),
    staleTime: 60_000,
    retry: 1,
  });
}

export function useCurrentUser() {
  const token = hasSessionFlag();

  return useQuery({
    ...currentUserQueryOptions(),
    enabled: !!token,
  });
}

export function getCurrentUser(): Profile | null {
  if (!hasSessionFlag()) return null;

  return getBrowserQueryClient()?.getQueryData<Profile>(CURRENT_USER_QUERY_KEY) ?? null;
}

/**
 * O id de quem esta na tela, mesmo antes de `/me` responder.
 *
 * O cache da query `["me"]` so tem o valor DEPOIS que a resposta chega. Uma tela que le o id
 * por aqui (sem se inscrever na query) desenhava o "outro participante" errado: na caixa de
 * entrada cada conversa aparecia com o nome e a foto de quem estava olhando. O app ja grava o
 * usuario no `localStorage` no login (`current_user`), entao esse e o valor de verdade enquanto
 * o cache nao tem nada.
 */
export function getCurrentUserId() {
  const doCache = getCurrentUser()?.id;
  if (doCache) return doCache;
  if (typeof window === "undefined") return null;
  if (!hasSessionFlag()) return null;
  try {
    const raw = localStorage.getItem("current_user");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { id?: string };
    return parsed.id ?? null;
  } catch {
    return null;
  }
}
