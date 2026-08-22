import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { Bureau, BureauInput } from "~/schemas/bureau";

/** Repository Bureaux (structure organisationnelle). Seul endroit autorisé à connaître ses routes. */
export function useBureauxApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<Bureau>>("/bureaux", { query: params }),

    getById: (id: number) => api<ApiResponse<Bureau>>(`/bureaux/${id}`),

    create: (payload: BureauInput) =>
      api<ApiResponse<Bureau>>("/bureaux", { method: "POST", body: payload }),

    update: (id: number, payload: Partial<BureauInput>) =>
      api<ApiResponse<Bureau>>(`/bureaux/${id}`, { method: "PUT", body: payload }),

    remove: (id: number) =>
      api<{ message: string }>(`/bureaux/${id}`, { method: "DELETE" }),
  };
}
