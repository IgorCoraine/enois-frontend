import type { ContributorContributionKind } from "./contributor-contribution-kind";
import type { ContributorContributionStatus } from "./contributor-contribution-status";

export type ContributorContribution = {
  id: string;
  userId: string | null;
  username: string | null;
  githubLogin: string;
  repository: string;
  kind: ContributorContributionKind;
  number: number;
  title: string;
  url: string;
  labels: string | null;
  mergedAt: string | null;
  closedAt: string | null;
  changedFiles: number;
  additions: number;
  deletions: number;
  hasTests: boolean;
  reverted: boolean;
  status: ContributorContributionStatus;
  score: number;
  reviewNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
};
