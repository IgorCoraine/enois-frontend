import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { RichText } from "./rich-text";

describe("RichText links", () => {
  it.each([
    "[clique](javascript:alert(1))",
    "[clique]( javascript:alert(1))",
    "![foto](javascript:alert(1))",
    "[clique](data:text/html,oi)",
  ])("never renders a script href for %j", (content) => {
    const html = renderToStaticMarkup(<RichText content={content} />);
    expect(html).not.toMatch(/href="\s*(javascript|data):/i);
  });

  it("keeps http links clickable", () => {
    const html = renderToStaticMarkup(<RichText content="[site](https://example.com)" />);
    expect(html).toContain('href="https://example.com"');
  });
});
