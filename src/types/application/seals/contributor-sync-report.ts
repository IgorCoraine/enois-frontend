export type ContributorSyncReport = {
  dryRun: boolean;
  full: boolean;
  repositories: string[];
  fetched: number;
  created: number;
  updated: number;
  skipped: number;
  detailsFetched: number;
  revertedFlagged: number;
  issuesFetched: number;
  issuesCreated: number;
  issuesUpdated: number;
  sealsRecalculated: number;
  rateLimited: boolean;
  errors: string[];
  startedAt: string;
  finishedAt: string;
};
