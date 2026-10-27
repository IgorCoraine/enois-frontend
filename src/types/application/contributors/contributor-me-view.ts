import type { ContributorApplicationSummary } from "./contributor-application-summary";

export type ContributorMeView = {
  verified: boolean;
  github: string | null;
  applicationPending: boolean;
  name: string | null;
  email: string | null;
  application: ContributorApplicationSummary | null;
};
