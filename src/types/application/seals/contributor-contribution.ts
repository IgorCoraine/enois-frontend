import type { ContributorContributionStatus } from "./contributor-contribution-status";

export type ContributorContribution = {
  id: string;
  userId: string | null;
  username: string | null;
  githubLogin: string;
  repository: string;
  prNumber: number;
  title: string;
  url: string;
  mergedAt: string | null;
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
