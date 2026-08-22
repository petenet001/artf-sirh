import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { Diplome, DiplomeInput } from "~/schemas/diplome";

/** Repository Diplômes (référentiel RH). Seul endroit autorisé à connaître ses routes. */
export function useDiplomesApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<Diplome>>("/diplomes", { query: params }),

    getById: (id: number) => api<ApiResponse<Diplome>>(`/diplomes/${id}`),

    create: (payload: DiplomeInput) =>
      api<ApiResponse<Diplome>>("/diplomes", { method: "POST", body: payload }),

    update: (id: number, payload: Partial<DiplomeInput>) =>
      api<ApiResponse<Diplome>>(`/diplomes/${id}`, { method: "PUT", body: payload }),

    remove: (id: number) =>
      api<{ message: string }>(`/diplomes/${id}`, { method: "DELETE" }),
  };
}
