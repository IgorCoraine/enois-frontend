import { texts } from "@/texts";
import { afterEach, describe, expect, it, vi } from "vitest";

import { preferencesApi } from "./preferences";

describe("LinkedIn archive import", () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each([
    ["API", Response.json({ code: "IMPORT_TOO_LARGE", message: "x" }, { status: 413 })],
    ["proxy", new Response("<html>413</html>", { status: 413 })],
  ])("explains an archive over the limits (%s)", async (_, response) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => response),
    );
    const file = new File(["zip"], "linkedin.zip");

    await expect(preferencesApi.importLinkedinArchive(file)).rejects.toThrow(
      texts.errors.knownCodes.IMPORT_TOO_LARGE,
    );
  });
});
