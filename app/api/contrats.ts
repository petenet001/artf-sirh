import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { Contrat, ContratInput } from "~/schemas/contrat";

/**
 * Repository Contrats. Seul endroit autorisé à connaître les routes contrats.
 * Tout vit sous `/integration` et requiert l'auth. Pas d'update/remove.
 * Toutes les fonctions throwent en cas d'erreur.
 */
export function useContratsApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<Contrat>>("/integration/contrats", { query: params }),

    getById: (id: number) =>
      api<ApiResponse<Contrat>>(`/integration/contrats/${id}`),

    create: (payload: ContratInput) =>
      api<ApiResponse<Contrat>>("/integration/contrats", {
        method: "POST",
        body: payload,
      }),

    resilier: (id: number) =>
      api<ApiResponse<Contrat>>(`/integration/contrats/${id}/resilier`, {
        method: "POST",
      }),
  };
}
