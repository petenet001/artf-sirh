import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { AffiliationSociale, AffiliationSocialeInput, AgentSocial } from "~/schemas/affiliation-sociale";

/**
 * Repository Affiliations sociales (`/affaires-sociales/affiliations`).
 *
 * Règles portées par l'API : une seule affiliation **active** par couple
 * agent + organisme ; sur la CNSS, `numero_affiliation` omis reprend
 * `agent.numero_cnss`, et une affiliation CNSS active met à jour ce numéro ;
 * organisme inactif ou agent archivé → 422.
 *
 * Filtres serveur : `agent_id`, `organisme_id`, `statut`.
 */
export function useAffiliationsSocialesApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<AffiliationSociale>>("/affaires-sociales/affiliations", { query: params }),

    byAgent: (agentId: number) =>
      api<ApiCollection<AffiliationSociale>>(`/affaires-sociales/agents/${agentId}/affiliations`),

    /** Agents non archivés et non stagiaires sans affiliation CNSS active. */
    sansAffiliationCnss: () =>
      api<ApiCollection<AgentSocial>>("/affaires-sociales/alertes/sans-affiliation-cnss"),

    getById: (id: number) => api<ApiResponse<AffiliationSociale>>(`/affaires-sociales/affiliations/${id}`),

    create: (payload: AffiliationSocialeInput) =>
      api<ApiResponse<AffiliationSociale>>("/affaires-sociales/affiliations", { method: "POST", body: payload }),

    update: (id: number, payload: Partial<AffiliationSocialeInput>) =>
      api<ApiResponse<AffiliationSociale>>(`/affaires-sociales/affiliations/${id}`, { method: "PUT", body: payload }),

    remove: (id: number) =>
      api<{ message: string }>(`/affaires-sociales/affiliations/${id}`, { method: "DELETE" }),
  };
}
