import { describe, expect, it, vi } from "vitest";

import { authApi } from "./auth";

const post = vi.hoisted(() => vi.fn(async () => ({})));
vi.mock("../api-client", () => ({ api: { post, get: vi.fn() } }));

describe("authApi", () => {
  it("starts authenticator setup with the current password", async () => {
    await authApi.startTotpSetup("s3nha");
    expect(post).toHaveBeenCalledWith("/auth/2fa/totp/setup", { password: "s3nha" });
  });
});
