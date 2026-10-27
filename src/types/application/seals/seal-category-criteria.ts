import type { SealTier } from "./seal-tier";

export type SealCategoryCriteria = {
  category: string;
  name: string;
  description: string;
  tiers: SealTier[];
};
