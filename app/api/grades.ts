import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { Grade, GradeInput } from "~/schemas/grade";

/** Repository Grades (référentiel RH). Seul endroit autorisé à connaître ses routes. */
export function useGradesApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<Grade>>("/grades", { query: params }),

    getById: (id: number) => api<ApiResponse<Grade>>(`/grades/${id}`),

    create: (payload: GradeInput) =>
      api<ApiResponse<Grade>>("/grades", { method: "POST", body: payload }),

    update: (id: number, payload: Partial<GradeInput>) =>
      api<ApiResponse<Grade>>(`/grades/${id}`, { method: "PUT", body: payload }),

    remove: (id: number) =>
      api<{ message: string }>(`/grades/${id}`, { method: "DELETE" }),
  };
}
