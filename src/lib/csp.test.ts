import { describe, expect, it } from "vitest";

import { contentSecurityPolicy, createCspNonce } from "./csp";

function scriptSrc(policy: string): string {
  return policy.split("; ").find((d) => d.startsWith("script-src")) ?? "";
}

describe("contentSecurityPolicy", () => {
  it("allows inline scripts only through the nonce", () => {
    const src = scriptSrc(contentSecurityPolicy("abc123"));
    expect(src).toContain("'nonce-abc123'");
    expect(src).not.toContain("'unsafe-inline'");
  });

  it("falls back to unsafe-inline only without a nonce (dev server)", () => {
    expect(scriptSrc(contentSecurityPolicy(null))).toContain("'unsafe-inline'");
  });

  it("keeps clickjacking and plugin protections", () => {
    const policy = contentSecurityPolicy("n");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
  });
});

describe("createCspNonce", () => {
  it("is fresh on every call", () => {
    expect(createCspNonce()).not.toBe(createCspNonce());
    expect(createCspNonce()).toMatch(/^[A-Za-z0-9+/]{22}==$/);
  });
});
