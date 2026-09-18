import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { VisiteMedicale, VisiteMedicaleInput } from "~/schemas/visite-medicale";
import type { AgentSocial } from "~/schemas/affiliation-sociale";

/**
 * Repository Visites médicales (`/affaires-sociales/visites-medicales`, D.3.5).
 *
 * Pas de circuit : une visite est constatée, pas instruite. Le seul enjeu de
 * conformité est la visite **annuelle**, dont l'absence remonte dans
 * `alertesAnnuelles()` — même forme que l'alerte CNSS déjà en place.
 *
 * Filtres serveur : `agent_id`, `type`.
 */
export function useVisitesMedicalesApi() {
  const api = useApiClient();
  const base = "/affaires-sociales/visites-medicales";

  return {
    list: (params?: ListParams) => api<ApiCollection<VisiteMedicale>>(base, { query: params }),

    byAgent: (agentId: number) =>
      api<ApiCollection<VisiteMedicale>>(`/affaires-sociales/agents/${agentId}/visites-medicales`),

    getById: (id: number) => api<ApiResponse<VisiteMedicale>>(`${base}/${id}`),

    create: (payload: VisiteMedicaleInput) =>
      api<ApiResponse<VisiteMedicale>>(base, { method: "POST", body: payload }),

    update: (id: number, payload: Partial<VisiteMedicaleInput>) =>
      api<ApiResponse<VisiteMedicale>>(`${base}/${id}`, { method: "PUT", body: payload }),

    remove: (id: number) => api<{ message: string }>(`${base}/${id}`, { method: "DELETE" }),

    /** Agents présents sans visite annuelle sur la période courante. */
    alertesAnnuelles: () =>
      api<ApiCollection<AgentSocial>>("/affaires-sociales/alertes/visites-annuelles-manquantes"),
  };
}
