import type { AuthUser } from "./auth-user";

/** What the app keeps about a session; the tokens themselves stay in HttpOnly cookies. */
export type SessionPayload = {
  expiresAt?: string | null;
  refreshExpiresAt?: string | null;
  user?: AuthUser;
};
