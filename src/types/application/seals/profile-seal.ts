import type { SealEvidence } from "./seal-evidence";

export type ProfileSeal = {
  type: string;
  name: string;
  description: string;
  category: string;
  grantedAt: string;
  evidence: SealEvidence[];
};
