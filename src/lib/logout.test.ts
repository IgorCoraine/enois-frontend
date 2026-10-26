import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { logout } from "./logout";

const api = vi.hoisted(() => ({ logout: vi.fn(), clearSession: vi.fn() }));

vi.mock("./api", async () => {
  const { ApiError } = await import("./api-client");
  return { ApiError, authApi: { logout: api.logout }, clearSession: api.clearSession };
});

describe("logout", () => {
  const location = { href: "/feed" };

  beforeEach(() => {
    vi.clearAllMocks();
    location.href = "/feed";
    vi.stubGlobal("window", { location });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("clears the local session after the API confirmed", async () => {
    api.logout.mockResolvedValueOnce(undefined);

    await expect(logout()).resolves.toBe(true);
    expect(api.clearSession).toHaveBeenCalledOnce();
    expect(location.href).toBe("/entrar");
  });

  it("keeps the session when the API could not confirm", async () => {
    const { ApiError } = await import("./api-client");
    api.logout.mockRejectedValueOnce(new ApiError(0, "NETWORK_ERROR", "offline"));

    await expect(logout()).resolves.toBe(false);
    expect(api.clearSession).not.toHaveBeenCalled();
    expect(location.href).toBe("/feed");
  });

  it("treats an already unknown session (401) as logged out", async () => {
    const { ApiError } = await import("./api-client");
    api.logout.mockRejectedValueOnce(new ApiError(401, "UNAUTHENTICATED", "x"));

    await expect(logout()).resolves.toBe(true);
    expect(api.clearSession).toHaveBeenCalledOnce();
  });
});
