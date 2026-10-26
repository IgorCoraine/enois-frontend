import { ApiError, authApi, clearSession } from "./api";

/**
 * Ends the session: the API revokes it and clears the HttpOnly cookies, then the local state is
 * dropped and the app reloads to discard anything held in memory.
 *
 * Returns false when the API could not confirm: the cookies would still be valid, so showing the
 * person as logged out would be a lie (shared devices). A 401 means the API no longer knows the
 * session, which is the same outcome as a confirmed logout.
 */
export async function logout(): Promise<boolean> {
  try {
    await authApi.logout();
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 401)) return false;
  }

  clearSession();

  if (typeof window !== "undefined") {
    window.location.href = "/entrar";
  }
  return true;
}
