import type { SealEvidence } from "./seal-evidence";

export type ProfileSeal = {
  type: string;
  name: string;
  description: string;
  category: string;
  categoryName: string;
  grantedAt: string;
  evidenceCount: number;
  minCount: number;
  maxCount: number | null;
  evidence: SealEvidence[];
};
