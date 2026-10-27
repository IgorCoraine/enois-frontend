import type { GitHubSyncState } from "./github-sync-state";

export type GitHubIdentity = {
  linked: boolean;
  login: string | null;
  linkedAt: string | null;
  lastSyncedAt: string | null;
  syncState: GitHubSyncState | null;
  lastSyncError: string | null;
};
