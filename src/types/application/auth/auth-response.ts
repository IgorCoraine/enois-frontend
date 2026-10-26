import type { AuthUser } from "./auth-user";

/** Session-issuing responses: the tokens arrive as HttpOnly cookies, never in the body. */
export type AuthResponse = {
  expiresAt: string;
  refreshExpiresAt: string;
  user: AuthUser;
};
