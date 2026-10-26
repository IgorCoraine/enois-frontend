import { texts } from "@/texts";
import { describe, expect, it } from "vitest";

import { twoFactorLockedMessage } from "./two-factor-locked";

describe("twoFactorLockedMessage", () => {
  it("asks for a new code on the email-code challenge", () => {
    expect(twoFactorLockedMessage("EMAIL")).toBe(texts.auth.twoFactor.tooManyAttemptsEmail);
  });

  it("asks to start the login again on the authenticator challenge", () => {
    expect(twoFactorLockedMessage("TOTP")).toBe(texts.auth.twoFactor.tooManyAttempts);
  });
});
