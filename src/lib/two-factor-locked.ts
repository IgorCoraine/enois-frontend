import { texts } from "@/texts";
import type { TwoFactorMethod } from "@/types/application/auth/two-factor-method";

/**
 * What to say when a 2FA challenge is locked (429 TOO_MANY_ATTEMPTS). Resending an email code
 * resets the attempts, so that flow asks for a new code; an authenticator challenge can only be
 * replaced by starting the login again.
 */
export function twoFactorLockedMessage(method: TwoFactorMethod): string {
  return method === "EMAIL"
    ? texts.auth.twoFactor.tooManyAttemptsEmail
    : texts.auth.twoFactor.tooManyAttempts;
}
