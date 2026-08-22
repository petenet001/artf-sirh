import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { RemiseMateriel, RemiseMaterielInput } from "~/schemas/remise-materiel";

/**
 * Repository Remises de matériel. Seul endroit autorisé à connaître les
 * routes remises-materiel. Tout vit sous `/integration` et requiert l'auth.
 * Toutes les fonctions throwent en cas d'erreur.
 */
export function useRemisesMaterielApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<RemiseMateriel>>("/integration/remises-materiel", { query: params }),

    getById: (id: number) =>
      api<ApiResponse<RemiseMateriel>>(`/integration/remises-materiel/${id}`),

    create: (payload: RemiseMaterielInput) =>
      api<ApiResponse<RemiseMateriel>>("/integration/remises-materiel", {
        method: "POST",
        body: payload,
      }),
  };
}
