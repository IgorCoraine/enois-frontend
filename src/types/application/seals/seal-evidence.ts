import type { ContributorContributionKind } from "./contributor-contribution-kind";

export type SealEvidence = {
  kind: ContributorContributionKind;
  repository: string;
  number: number;
  title: string;
  url: string;
  happenedAt: string | null;
  category: string;
};
