import type { ApiResponse, ApiCollection } from "~/types/api";
import type {
  AvisHierarchique,
  AvisHierarchiqueInput,
  NiveauRequis,
} from "~/schemas/avis-hierarchique";

/**
 * Repository Avis hiérarchiques (CCN art. 64). Les avis se posent **sur une
 * fiche** (`/avancements/evaluations/{id}/avis-hierarchiques`) puis se modifient
 * et se signent **par leur id** (`/avancements/avis-hierarchiques/{id}`).
 *
 * Deux règles portées par l'API :
 * - un avis signé n'est plus modifiable (422 sur `update`) ;
 * - `POST evaluations/{id}/envoyer-rh` est refusé (422) tant qu'un niveau requis
 *   n'a pas signé — d'où l'importance de `niveauxRequis` pour l'affichage.
 */
export function useAvisHierarchiquesApi() {
  const api = useApiClient();

  return {
    /** Chaîne des niveaux attendus pour cette fiche, dans l'ordre. */
    niveauxRequis: (evaluationId: number) =>
      api<ApiCollection<NiveauRequis>>(`/avancements/evaluations/${evaluationId}/niveaux-requis`),

    byEvaluation: (evaluationId: number) =>
      api<ApiCollection<AvisHierarchique>>(`/avancements/evaluations/${evaluationId}/avis-hierarchiques`),

    poster: (evaluationId: number, payload: AvisHierarchiqueInput) =>
      api<ApiResponse<AvisHierarchique>>(`/avancements/evaluations/${evaluationId}/avis-hierarchiques`, {
        method: "POST",
        body: payload,
      }),

    update: (id: number, payload: AvisHierarchiqueInput) =>
      api<ApiResponse<AvisHierarchique>>(`/avancements/avis-hierarchiques/${id}`, {
        method: "PUT",
        body: payload,
      }),

    /** Signature définitive : l'avis devient non modifiable. */
    signer: (id: number) =>
      api<ApiResponse<AvisHierarchique>>(`/avancements/avis-hierarchiques/${id}/signer`, {
        method: "POST",
        body: {},
      }),
  };
}
