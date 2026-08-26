import type { ApiResponse } from "~/types/api";
import type { DocumentDossier } from "~/schemas/document-dossier";
import type { TypeDocument } from "~/schemas/type-document";

/** Une pièce attendue mais pas encore déposée (bloc `manquants`). */
export interface DocumentManquant {
  type_document: TypeDocument;
  est_obligatoire: boolean;
}

/** Compteurs de l'état documentaire d'un dossier (bloc `resume`). */
export interface DocumentsEtatResume {
  total_deposes: number;
  types_deposes: number;
  obligatoires_attendus: number;
  obligatoires_deposes: number;
  obligatoires_manquants: number;
  optionnels_attendus: number;
  optionnels_deposes: number;
  optionnels_manquants: number;
  tous_obligatoires_deposes: boolean;
}

/**
 * État documentaire complet d'un dossier — renvoyé par
 * `GET /integration/dossiers/{id}/documents` (DocumentDossierService::getEtatDocuments).
 * Le backend calcule lui-même l'attendu vs le déposé.
 */
export interface DocumentsEtat {
  deposes: DocumentDossier[];
  manquants: DocumentManquant[];
  resume: DocumentsEtatResume;
}

/**
 * Repository Documents de dossier. Seul endroit autorisé à connaître les
 * routes documents. Tout vit sous `/integration` et requiert l'auth.
 * L'upload se fait en multipart : `store` accepte un `FormData` (une pièce).
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

    /** État documentaire : pièces déposées, attendues manquantes et résumé. */
    parDossier: (dossierId: number) =>
      api<ApiResponse<DocumentsEtat>>(`/integration/dossiers/${dossierId}/documents`),

    valider: (id: number) =>
      api<ApiResponse<DocumentDossier>>(`/integration/documents/${id}/valider`, {
        method: "POST",
      }),

    remove: (id: number) =>
      api<{ message: string }>(`/integration/documents/${id}`, { method: "DELETE" }),
  };
}
