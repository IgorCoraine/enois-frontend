import type { ContributorApplicationSource } from "./contributor-application-source";
import type { ContributorApplicationStatus } from "./contributor-application-status";

export type ContributorAdminView = {
  id: string | null;
  userId: string | null;
  name: string;
  github: string;
  email: string | null;
  area: string | null;
  experience: string | null;
  message: string | null;
  status: ContributorApplicationStatus;
  source: ContributorApplicationSource;
  formPending: boolean;
  sealName: string | null;
  evidenceCount: number | null;
  acceptedTermsAt: string | null;
  createdAt: string;
};
