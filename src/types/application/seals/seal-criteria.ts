import type { SealCategoryCriteria } from "./seal-category-criteria";

export type SealCriteria = {
  repositories: string[];
  categories: SealCategoryCriteria[];
  policies: string[];
  states: string[];
};
