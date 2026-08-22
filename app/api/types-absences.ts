import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { TypeAbsence, TypeAbsenceInput } from "~/schemas/type-absence";

/** Repository Types d'absence (référentiel). Seul endroit autorisé à connaître ses routes. */
export function useTypesAbsencesApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<TypeAbsence>>("/types-absences", { query: params }),

    getById: (id: number) => api<ApiResponse<TypeAbsence>>(`/types-absences/${id}`),

    create: (payload: TypeAbsenceInput) =>
      api<ApiResponse<TypeAbsence>>("/types-absences", { method: "POST", body: payload }),

    update: (id: number, payload: Partial<TypeAbsenceInput>) =>
      api<ApiResponse<TypeAbsence>>(`/types-absences/${id}`, {
        method: "PUT",
        body: payload,
      }),

    remove: (id: number) =>
      api<{ message: string }>(`/types-absences/${id}`, { method: "DELETE" }),
  };
}
