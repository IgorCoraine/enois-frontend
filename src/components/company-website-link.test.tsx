import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CompanyWebsiteLink } from "./company-website-link";

describe("CompanyWebsiteLink", () => {
  it("links an https website", () => {
    const html = renderToStaticMarkup(<CompanyWebsiteLink website="https://enois.ia.br" />);
    expect(html).toContain('href="https://enois.ia.br"');
  });

  it.each(["javascript:alert(1)", " javascript:alert(1)", "data:text/html,oi", null])(
    "renders no link for %j",
    (website) => {
      expect(renderToStaticMarkup(<CompanyWebsiteLink website={website} />)).toBe("");
    },
  );
});
