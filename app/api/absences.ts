import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { Absence, AbsenceInput, RejetAbsenceInput } from "~/schemas/absence";

/**
 * Repository Absences (circuit N+1 seul — pas d'étape RH/DG). Seul endroit
 * autorisé à connaître les routes `/absences`. Permissions `consulter-absences`,
 * `creer-absences`, `valider-absences` ; signer = N+1 réel de l'agent (ou
 * `admin`), sinon 403 même avec la permission. Toutes throwent.
 */
export function useAbsencesApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) => api<ApiCollection<Absence>>("/absences", { query: params }),

    byAgent: (agentId: number, params?: ListParams) =>
      api<ApiCollection<Absence>>(`/absences/agents/${agentId}`, { query: params }),

    /** File N+1 : absences en attente dont l'utilisateur est le supérieur (admin : toutes). */
    aValider: () => api<ApiCollection<Absence>>("/absences/a-valider"),

    getById: (id: number) => api<ApiResponse<Absence>>(`/absences/${id}`),

    create: (payload: AbsenceInput) =>
      api<ApiResponse<Absence>>("/absences", { method: "POST", body: payload }),

    valider: (id: number) =>
      api<ApiResponse<Absence>>(`/absences/${id}/valider`, { method: "POST", body: {} }),

    rejeter: (id: number, payload: RejetAbsenceInput) =>
      api<ApiResponse<Absence>>(`/absences/${id}/rejeter`, { method: "POST", body: payload }),
  };
}
