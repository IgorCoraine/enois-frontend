import { texts } from "@/texts";
import { describe, expect, it } from "vitest";

import { ApiError } from "./api-client";
import { conversationErrorMessage } from "./conversation-error";

describe("conversationErrorMessage", () => {
  it("explains the minor protection rule", () => {
    const error = new ApiError(403, "MINOR_DM_RESTRICTED", "x", "/conversations");
    expect(conversationErrorMessage(error)).toBe(texts.messages.minorRestricted);
  });

  it("falls back to a generic message", () => {
    expect(conversationErrorMessage(new Error("boom"))).toBe(texts.messages.openError);
  });
});
