import type { ContributorAdminView } from "@/types/application/contributors/contributor-admin-view";
import type { ContributorApplicationInput } from "@/types/application/contributors/contributor-application-input";
import type { ContributorApplicationStatus } from "@/types/application/contributors/contributor-application-status";
import type { ContributorApplicationView } from "@/types/application/contributors/contributor-application-view";
import type { ContributorMeView } from "@/types/application/contributors/contributor-me-view";

import { api } from "../api-client";

export const contributorsApi = {
  /** Formulário público da landing: registra a candidatura e o aceite dos termos. */
  apply: (data: ContributorApplicationInput) =>
    api.post<ContributorApplicationView>("/contributors/applications", data),

  /** Confirmação de quem já tem contribuição verificada; o GitHub aprova, sem triagem. */
  applyVerified: (data: ContributorApplicationInput) =>
    api.post<ContributorApplicationView>("/contributors/applications/verified", data),

  /** Estado da conta logada: verificado? já confirmou os dados? */
  me: () => api.get<ContributorMeView>("/contributors/me"),

  /** Painel de contribuintes: candidaturas + verificados que ainda não confirmaram. */
  adminPanel: () => api.get<ContributorAdminView[]>("/admin/contributors/panel"),

  /** Fila interna (admin): documentação de quem se ofereceu para contribuir. */
  adminList: () => api.get<ContributorAdminView[]>("/admin/contributors/applications"),

  /** Triagem: move a candidatura entre nova, em análise, aprovada e recusada. */
  adminUpdateStatus: (id: string, status: ContributorApplicationStatus) =>
    api.patch<ContributorAdminView>(`/admin/contributors/applications/${id}`, { status }),
};
