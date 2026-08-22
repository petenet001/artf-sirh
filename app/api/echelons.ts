import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { Echelon, EchelonInput } from "~/schemas/echelon";

/** Repository Échelons (référentiel RH). Seul endroit autorisé à connaître ses routes. */
export function useEchelonsApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<Echelon>>("/echelons", { query: params }),

    getById: (id: number) => api<ApiResponse<Echelon>>(`/echelons/${id}`),

    create: (payload: EchelonInput) =>
      api<ApiResponse<Echelon>>("/echelons", { method: "POST", body: payload }),

    update: (id: number, payload: Partial<EchelonInput>) =>
      api<ApiResponse<Echelon>>(`/echelons/${id}`, { method: "PUT", body: payload }),

    remove: (id: number) =>
      api<{ message: string }>(`/echelons/${id}`, { method: "DELETE" }),
  };
}
