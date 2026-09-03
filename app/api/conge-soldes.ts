import type { ApiCollection, ListParams } from "~/types/api";
import type { CongeSolde } from "~/schemas/conge-solde";

/**
 * Repository Soldes de congé. Seul endroit autorisé à connaître ses routes.
 * Lecture seule (les soldes se créent/débitent côté serveur). Permission
 * `consulter-conges`.
 */
export function useCongeSoldesApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) => api<ApiCollection<CongeSolde>>("/conges/soldes", { query: params }),

    byAgent: (agentId: number, annee?: number) =>
      api<ApiCollection<CongeSolde>>(`/conges/agents/${agentId}/soldes`, {
        query: annee ? { annee } : undefined,
      }),
  };
}
