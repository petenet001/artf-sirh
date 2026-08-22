import type { ApiResponse, ApiCollection } from "~/types/api";
import type { DocumentDossier } from "~/schemas/document-dossier";

/**
 * Repository Documents de dossier. Seul endroit autorisé à connaître les
 * routes documents. Tout vit sous `/integration` et requiert l'auth.
 * L'upload se fait en multipart : `store` accepte un `FormData`.
 * Toutes les fonctions throwent en cas d'erreur.
 */
export function useDocumentsDossierApi() {
  const api = useApiClient();

  return {
    store: (dossierId: number, payload: FormData) =>
      api<ApiResponse<DocumentDossier>>(`/integration/dossiers/${dossierId}/documents`, {
        method: "POST",
        body: payload,
      }),

    parDossier: (dossierId: number) =>
      api<ApiCollection<DocumentDossier>>(`/integration/dossiers/${dossierId}/documents`),

    valider: (id: number) =>
      api<ApiResponse<DocumentDossier>>(`/integration/documents/${id}/valider`, {
        method: "POST",
      }),

    remove: (id: number) =>
      api<{ message: string }>(`/integration/documents/${id}`, { method: "DELETE" }),
  };
}
