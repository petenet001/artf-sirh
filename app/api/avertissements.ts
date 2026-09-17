import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { Avertissement, AvertissementInput } from "~/schemas/avertissement";

/**
 * Repository Avertissements (`/discipline/avertissements`). Mesure simple de la
 * RH, hors circuit disciplinaire : pas d'instruction ni de prononcé, mais elle
 * figure dans l'historique de l'agent.
 *
 * Lecture `consulter-discipline`, écriture `gerer-discipline`.
 * Filtres serveur : `agent_id`, `emetteur_id`.
 */
export function useAvertissementsApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<Avertissement>>("/discipline/avertissements", { query: params }),

    byAgent: (agentId: number) =>
      api<ApiCollection<Avertissement>>(`/discipline/agents/${agentId}/avertissements`),

    getById: (id: number) => api<ApiResponse<Avertissement>>(`/discipline/avertissements/${id}`),

    create: (payload: AvertissementInput) =>
      api<ApiResponse<Avertissement>>("/discipline/avertissements", { method: "POST", body: payload }),

    update: (id: number, payload: Partial<AvertissementInput>) =>
      api<ApiResponse<Avertissement>>(`/discipline/avertissements/${id}`, { method: "PUT", body: payload }),

    remove: (id: number) =>
      api<{ message: string }>(`/discipline/avertissements/${id}`, { method: "DELETE" }),
  };
}
