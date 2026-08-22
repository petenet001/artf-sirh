import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { TypeConge, TypeCongeInput } from "~/schemas/type-conge";

/** Repository Types de congé (référentiel). Seul endroit autorisé à connaître ses routes. */
export function useTypesCongesApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<TypeConge>>("/types-conges", { query: params }),

    getById: (id: number) => api<ApiResponse<TypeConge>>(`/types-conges/${id}`),

    create: (payload: TypeCongeInput) =>
      api<ApiResponse<TypeConge>>("/types-conges", { method: "POST", body: payload }),

    update: (id: number, payload: Partial<TypeCongeInput>) =>
      api<ApiResponse<TypeConge>>(`/types-conges/${id}`, { method: "PUT", body: payload }),

    remove: (id: number) =>
      api<{ message: string }>(`/types-conges/${id}`, { method: "DELETE" }),
  };
}
