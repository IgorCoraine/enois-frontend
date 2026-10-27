import type { ContributorApplicationSource } from "./contributor-application-source";
import type { ContributorApplicationStatus } from "./contributor-application-status";

export type ContributorApplicationSummary = {
  id: string;
  status: ContributorApplicationStatus;
  source: ContributorApplicationSource;
  createdAt: string;
};
