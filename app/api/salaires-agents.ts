import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type {
  SalaireAgent,
  SalaireAgentCreate,
  SalaireAgentCloturer,
  SalaireAgentAvancerEchelon,
} from "~/schemas/salaire-agent";

/**
 * Repository des salaires d'agents. Seul endroit qui connaît ces routes.
 * Deux familles : les routes globales `/salaires-agents` (racine, inchangées) et
 * les sous-routes carrière `/carriere/agents/{id}/salaires` (alias `/integration`
 * encore acceptés mais non ciblés). Les bulletins/attestations sont des PDF
 * (blob). Requiert les permissions `consulter-salaires` / `gerer-salaires`.
 */
/** Réponse de `salaires/actuel` : `data` est `null` pour un agent hors grille. */
export interface ReponseSalaireActuel {
  data: SalaireAgent | null;
  message?: string;
  meta?: { salaire_fonctionnel?: boolean };
}

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

    // — Sous-ressources carrière d'un agent ——————————————————————
    byAgent: (agentId: number) =>
      api<ApiCollection<SalaireAgent>>(`/carriere/agents/${agentId}/salaires`),

    /**
     * Salaire courant. Pour une fonction **hors grille** (DG / DC / DD, art. 55),
     * l'API renvoie `data: null` et `meta.salaire_fonctionnel: true` : il n'y a
     * pas de ligne indiciaire, et le bulletin indiciaire n'a pas de sens.
     */
    actuel: (agentId: number) =>
      api<ReponseSalaireActuel>(`/carriere/agents/${agentId}/salaires/actuel`),

    historique: (agentId: number) =>
      api<ApiCollection<SalaireAgent>>(`/carriere/agents/${agentId}/salaires/historique`),

    bulletin: (agentId: number) =>
      api<Blob>(`/carriere/agents/${agentId}/salaires/bulletin`, { responseType: "blob" }),

    avancerEchelon: (agentId: number, payload: SalaireAgentAvancerEchelon) =>
      api<ApiResponse<SalaireAgent>>(`/carriere/agents/${agentId}/salaires/avancer-echelon`, {
        method: "POST",
        body: payload,
      }),
  };
}
