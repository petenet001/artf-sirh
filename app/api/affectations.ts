import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { Affectation, AffectationInput } from "~/schemas/affectation";

/**
 * Repository Affectations. Seul endroit autorisé à connaître les routes
 * affectations. Tout vit sous `/integration` et requiert l'auth.
 * Toutes les fonctions throwent en cas d'erreur.
 */
export function useAffectationsApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<Affectation>>("/integration/affectations", { query: params }),

    getById: (id: number) =>
      api<ApiResponse<Affectation>>(`/integration/affectations/${id}`),

    create: (payload: AffectationInput) =>
      api<ApiResponse<Affectation>>("/integration/affectations", {
        method: "POST",
        body: payload,
      }),

    activer: (id: number, payload?: { dossier_integration_id?: number }) =>
      api<ApiResponse<Affectation>>(`/integration/affectations/${id}/activer`, {
        method: "POST",
        body: payload ?? {},
      }),

    rejeter: (id: number) =>
      api<ApiResponse<Affectation>>(`/integration/affectations/${id}/rejeter`, {
        method: "POST",
      }),

    terminer: (id: number) =>
      api<ApiResponse<Affectation>>(`/integration/affectations/${id}/terminer`, {
        method: "POST",
      }),
  };
}
