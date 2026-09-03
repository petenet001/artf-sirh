import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { Absence, AbsenceInput, RejetAbsenceInput } from "~/schemas/absence";

/**
 * Repository Absences (circuit unique : toute personne avec `valider-absences`
 * valide — pas de N+1/RH/DG). Seul endroit autorisé à connaître les routes
 * `/absences`. Permissions `consulter-absences`, `creer-absences`,
 * `valider-absences`. Toutes throwent.
 */
export function useAbsencesApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) => api<ApiCollection<Absence>>("/absences", { query: params }),

    byAgent: (agentId: number, params?: ListParams) =>
      api<ApiCollection<Absence>>(`/absences/agents/${agentId}`, { query: params }),

    getById: (id: number) => api<ApiResponse<Absence>>(`/absences/${id}`),

    create: (payload: AbsenceInput) =>
      api<ApiResponse<Absence>>("/absences", { method: "POST", body: payload }),

    valider: (id: number) =>
      api<ApiResponse<Absence>>(`/absences/${id}/valider`, { method: "POST", body: {} }),

    rejeter: (id: number, payload: RejetAbsenceInput) =>
      api<ApiResponse<Absence>>(`/absences/${id}/rejeter`, { method: "POST", body: payload }),
  };
}
