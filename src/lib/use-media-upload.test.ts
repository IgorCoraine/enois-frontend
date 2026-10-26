import { texts } from "@/texts";
import { describe, expect, it } from "vitest";

import { ApiError } from "./api-client";
import { uploadError } from "./use-media-upload";

describe("uploadError", () => {
  it("explains a file type the purpose does not take", () => {
    const err = uploadError(new ApiError(400, "MEDIA_TYPE_NOT_ALLOWED", "x", "/media/uploads"));
    expect(err).toMatchObject({
      code: "MEDIA_TYPE_NOT_ALLOWED",
      message: texts.errors.knownCodes.MEDIA_TYPE_NOT_ALLOWED,
    });
  });

  it("leaves other errors untouched", () => {
    const original = new Error("boom");
    expect(uploadError(original)).toBe(original);
  });
});
