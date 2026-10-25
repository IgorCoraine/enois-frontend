import type { ContributorAuditEvent } from "./contributor-audit-event";
import type { ContributorContribution } from "./contributor-contribution";

export type ContributorContributionDetail = {
  contribution: ContributorContribution;
  audit: ContributorAuditEvent[];
};
