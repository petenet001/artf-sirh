import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type {
  SalaireAgent,
  SalaireAgentCreate,
  SalaireAgentCloturer,
  SalaireAgentAvancerEchelon,
} from "~/schemas/salaire-agent";

/**
 * Repository des salaires d'agents. Seul endroit qui connaît ces routes.
 * Deux familles : les routes globales `/salaires-agents` et les sous-routes
 * `/integration/agents/{id}/salaires`. Les bulletins/attestations sont des PDF
 * (blob). Requiert les permissions `consulter-salaires` / `gerer-salaires`.
 */
export function useSalairesAgentsApi() {
  const api = useApiClient();

  return {
    // — Routes globales ————————————————————————————————————————
    list: (params?: ListParams) =>
      api<ApiCollection<SalaireAgent>>("/salaires-agents", { query: params }),

    getById: (id: number) => api<ApiResponse<SalaireAgent>>(`/salaires-agents/${id}`),

    create: (payload: SalaireAgentCreate) =>
      api<ApiResponse<SalaireAgent>>("/salaires-agents", { method: "POST", body: payload }),

    cloturer: (id: number, payload: SalaireAgentCloturer) =>
      api<ApiResponse<SalaireAgent>>(`/salaires-agents/${id}/cloturer`, {
        method: "POST",
        body: payload,
      }),

    bulletinById: (id: number) =>
      api<Blob>(`/salaires-agents/${id}/bulletin`, { responseType: "blob" }),

    // — Sous-ressources d'un agent ————————————————————————————
    byAgent: (agentId: number) =>
      api<ApiCollection<SalaireAgent>>(`/integration/agents/${agentId}/salaires`),

    actuel: (agentId: number) =>
      api<ApiResponse<SalaireAgent>>(`/integration/agents/${agentId}/salaires/actuel`),

    historique: (agentId: number) =>
      api<ApiCollection<SalaireAgent>>(`/integration/agents/${agentId}/salaires/historique`),

    bulletin: (agentId: number) =>
      api<Blob>(`/integration/agents/${agentId}/salaires/bulletin`, { responseType: "blob" }),

    avancerEchelon: (agentId: number, payload: SalaireAgentAvancerEchelon) =>
      api<ApiResponse<SalaireAgent>>(`/integration/agents/${agentId}/salaires/avancer-echelon`, {
        method: "POST",
        body: payload,
      }),
  };
}
