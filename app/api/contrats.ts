import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { Contrat, ContratInput } from "~/schemas/contrat";

/**
 * Repository Contrats (module carrière). Seul endroit autorisé à connaître les
 * routes contrats. Préfixe canonique `/carriere` (alias `/integration` encore
 * acceptés mais non ciblés). Pas d'update/remove. Les fonctions throwent.
 */
export function useContratsApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<Contrat>>("/carriere/contrats", { query: params }),

    getById: (id: number) =>
      api<ApiResponse<Contrat>>(`/carriere/contrats/${id}`),

    byAgent: (agentId: number) =>
      api<ApiCollection<Contrat>>(`/carriere/agents/${agentId}/contrats`),

    create: (payload: ContratInput) =>
      api<ApiResponse<Contrat>>("/carriere/contrats", {
        method: "POST",
        body: payload,
      }),

    resilier: (id: number) =>
      api<ApiResponse<Contrat>>(`/carriere/contrats/${id}/resilier`, {
        method: "POST",
      }),
  };
}
