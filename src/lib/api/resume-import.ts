import type { LinkedinImportPreview } from "@/types/application/profile/linkedin-import-preview";
import type { ResumeApplyPrefill } from "@/types/application/profile/resume-apply-prefill";

import { ApiError, api } from "../api-client";

/**
 * Importação via CURRÍCULO (PDF ou texto). Terceira origem do retrato profissional, ao lado
 * do ZIP do LinkedIn e do texto colado: a pessoa sobe o arquivo e recebe o retrato no MESMO
 * formato do LinkedIn — o front reaproveita as telas de revisão, nada é salvo automaticamente.
 */
export const resumeImportApi = {
  /** Sobe o currículo e devolve o retrato para revisão antes de salvar (multipart). */
  importResume: (file: File): Promise<LinkedinImportPreview> =>
    uploadResume<LinkedinImportPreview>("/me/import/resume", file),

  /**
   * Preenche a inscrição da vaga com os dados do currículo: sobe o arquivo + o id da vaga e
   * recebe mensagem e respostas sugeridas. Só sugere — a inscrição continua no POST existente,
   * com a pessoa revisando antes de enviar.
   */
  prefillApplication: (jobId: string, file: File): Promise<ResumeApplyPrefill> =>
    uploadResume<ResumeApplyPrefill>(`/me/import/resume/prefill/${jobId}`, file),
};

/**
 * Multipart through the shared client, so it gets the same session handling (proactive refresh,
 * 401 refresh-and-retry) as every other call; errors keep the friendly resume messages.
 */
async function uploadResume<T>(path: string, file: File): Promise<T> {
  const formData = new FormData();
  formData.append("file", file);
  try {
    return await api.post<T>(path, formData, { idempotent: false });
  } catch (error) {
    if (error instanceof ApiError && error.status !== 0) {
      throw new ApiError(
        error.status,
        error.code,
        resumeErrorMessage(error.code, error.message),
        error.path,
      );
    }
    throw error;
  }
}

/**
 * Mensagem amigável por código de erro do backend (o DOC/DOCX orienta a exportar em PDF;
 * o PDF escaneado ou com senha explica o porquê).
 */
export function resumeErrorMessage(code: string | undefined, fallback?: string): string {
  switch (code) {
    case "UNSUPPORTED_FORMAT":
      return "Esse formato não entra: envie o currículo em PDF ou texto. DOC/DOCX? Exporte em PDF no seu editor (Arquivo → Exportar como PDF).";
    case "UNREADABLE_RESUME":
      return "Não encontrei texto legível nesse arquivo. Se for PDF escaneado (foto das páginas) ou protegido por senha, exporte de novo como PDF com texto.";
    case "FILE_TOO_LARGE":
      return "Arquivo grande demais: o currículo vai até 10 MB (PDF de até 20 páginas) ou 512 KB em texto.";
    case "FILE_REQUIRED":
      return "Escolha o arquivo do currículo para importar.";
    default:
      return fallback ?? "Não foi possível ler o currículo. Tente de novo.";
  }
}
