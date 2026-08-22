import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { Nomination, NominationInput } from "~/schemas/nomination";

/**
 * Repository Nominations. Seul endroit autorisé à connaître les routes
 * nominations. Tout vit sous `/integration` et requiert l'auth.
 * Toutes les fonctions throwent en cas d'erreur.
 */
export function useNominationsApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<Nomination>>("/integration/nominations", { query: params }),

    getById: (id: number) =>
      api<ApiResponse<Nomination>>(`/integration/nominations/${id}`),

    create: (payload: NominationInput) =>
      api<ApiResponse<Nomination>>("/integration/nominations", {
        method: "POST",
        body: payload,
      }),

    activer: (id: number, payload?: { dossier_integration_id?: number }) =>
      api<ApiResponse<Nomination>>(`/integration/nominations/${id}/activer`, {
        method: "POST",
        body: payload ?? {},
      }),

    cloturer: (id: number) =>
      api<ApiResponse<Nomination>>(`/integration/nominations/${id}/cloturer`, {
        method: "POST",
      }),

    rejeter: (id: number) =>
      api<ApiResponse<Nomination>>(`/integration/nominations/${id}/rejeter`, {
        method: "POST",
      }),
  };
}
