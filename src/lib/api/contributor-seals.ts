import type { ContributorContribution } from "@/types/application/seals/contributor-contribution";
import type { ContributorContributionDetail } from "@/types/application/seals/contributor-contribution-detail";
import type { ContributorContributionStatus } from "@/types/application/seals/contributor-contribution-status";
import type { ContributorRepository } from "@/types/application/seals/contributor-repository";
import type { ContributorSyncReport } from "@/types/application/seals/contributor-sync-report";
import type { GitHubIdentity } from "@/types/application/seals/github-identity";
import type { ProfileSeal } from "@/types/application/seals/profile-seal";
import type { SealCriteria } from "@/types/application/seals/seal-criteria";

import { api, buildQuery } from "../api-client";

/** Selos de contribuição (não confundir com os selos de post em `seals.ts`). */
export const contributorSealsApi = {
  /** Selos ativos no perfil público (só evidências validadas). */
  byUsername: (username: string) =>
    api.get<ProfileSeal[]>(`/users/${encodeURIComponent(username)}/seals`),

  /** Critérios públicos e repositórios elegíveis. */
  criteria: () => api.get<SealCriteria>("/seals/criteria"),

  /** Estado do vínculo GitHub da conta logada. */
  githubStatus: () => api.get<GitHubIdentity>("/me/github"),

  adminContributions: (status?: ContributorContributionStatus) =>
    api.get<ContributorContribution[]>(
      `/admin/contributors/contributions${buildQuery({ status })}`,
    ),

  adminDetail: (id: string) =>
    api.get<ContributorContributionDetail>(`/admin/contributors/contributions/${id}`),

  adminReview: (id: string, status: ContributorContributionStatus, note: string) =>
    api.post<ContributorContribution>(`/admin/contributors/contributions/${id}/review`, {
      status,
      note,
    }),

  adminRevokeSeal: (userId: string, reason: string) =>
    api.post<{ status: string }>(`/admin/contributors/seals/${userId}/revoke`, { reason }),

  adminSync: (data: { dryRun: boolean; full: boolean; repositories?: string[] }) =>
    api.post<ContributorSyncReport>("/admin/contributors/sync", data),

  adminRepositories: () => api.get<ContributorRepository[]>("/admin/contributors/repositories"),

  adminUpdateRepository: (repository: string, enabled: boolean) =>
    api.patch<ContributorRepository>("/admin/contributors/repositories", { repository, enabled }),
};
