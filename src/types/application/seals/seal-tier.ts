export type SealTier = {
  type: string;
  name: string;
  description: string;
  minCount: number;
  maxCount: number | null;
};
