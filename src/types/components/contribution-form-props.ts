import type { ContributionFormInitial } from "./contribution-form-initial";
import type { ContributionFormMode } from "./contribution-form-mode";

export type ContributionFormProps = {
  mode?: ContributionFormMode;
  initial?: ContributionFormInitial;
  onSuccess?: () => void;
};
