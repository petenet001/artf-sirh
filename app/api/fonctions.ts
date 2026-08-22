import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { Fonction, FonctionInput } from "~/schemas/fonction";

/** Repository Fonctions (référentiel RH). Seul endroit autorisé à connaître ses routes. */
export function useFonctionsApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<Fonction>>("/fonctions", { query: params }),

    getById: (id: number) => api<ApiResponse<Fonction>>(`/fonctions/${id}`),

    create: (payload: FonctionInput) =>
      api<ApiResponse<Fonction>>("/fonctions", { method: "POST", body: payload }),

    update: (id: number, payload: Partial<FonctionInput>) =>
      api<ApiResponse<Fonction>>(`/fonctions/${id}`, { method: "PUT", body: payload }),

    remove: (id: number) =>
      api<{ message: string }>(`/fonctions/${id}`, { method: "DELETE" }),
  };
}
