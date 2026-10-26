import { describe, expect, it } from "vitest";

import { oauthCallbackUrl } from "./oauth-callback";

describe("oauthCallbackUrl", () => {
  it("builds the API callback for a known provider", () => {
    expect(oauthCallbackUrl("LINKEDIN", "c&1", "s")).toBe(
      "/api/auth/oauth/linkedin/callback?code=c%261&state=s",
    );
  });

  it.each(["../admin", "linkedin/../../x", "evil", ""])("refuses provider %j", (provider) => {
    expect(oauthCallbackUrl(provider, "c", "s")).toBeNull();
  });
});
