import { texts } from "@/texts";

import { ApiError } from "./api-client";

/** What to tell the person when a conversation could not be opened. */
export function conversationErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.code === "MINOR_DM_RESTRICTED") {
    return texts.messages.minorRestricted;
  }
  return texts.messages.openError;
}
