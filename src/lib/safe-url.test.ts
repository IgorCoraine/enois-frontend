import { describe, expect, it } from "vitest";

import { safeHref } from "./safe-url";

describe("safeHref", () => {
  it.each([
    "https://enois.ia.br/feed",
    "http://example.com",
    "mailto:ada@example.com",
    "/perfil/ada",
    "#sobre",
    "?tab=login",
  ])("keeps %s", (value) => {
    expect(safeHref(value)).toBe(value);
  });

  it.each([
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    " javascript:alert(1)",
    "java\tscript:alert(1)",
    "java\nscript:alert(1)",
    "\u0001javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "",
    null,
    undefined,
  ])("rejects %j", (value) => {
    expect(safeHref(value)).toBeNull();
  });
});
