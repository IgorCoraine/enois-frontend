import { describe, expect, it } from "vitest";

import { withSecurityHeaders } from "./server";

function referrerPolicy(path: string): string | null {
  const response = withSecurityHeaders(
    new Response("<html></html>"),
    new Request(`https://enois.ia.br${path}?token=secret`),
    "nonce",
  );
  return response.headers.get("referrer-policy");
}

describe("security headers", () => {
  it.each(["/auth/callback", "/auth/reset", "/auth/verify"])(
    "never leaks the URL of %s, which carries a secret",
    (path) => {
      expect(referrerPolicy(path)).toBe("no-referrer");
    },
  );

  it("sends only the origin cross-site elsewhere", () => {
    expect(referrerPolicy("/feed")).toBe("strict-origin-when-cross-origin");
  });

  it("isolates the window and the resources from other origins", () => {
    const response = withSecurityHeaders(
      new Response(""),
      new Request("https://enois.ia.br/"),
      "n",
    );
    expect(response.headers.get("cross-origin-opener-policy")).toBe("same-origin");
    expect(response.headers.get("cross-origin-resource-policy")).toBe("same-site");
    expect(response.headers.get("content-security-policy")).toContain("'nonce-n'");
  });
});
