import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { Localite, LocaliteInput } from "~/schemas/localite";
import type { Administration } from "~/schemas/administration";

/** Repository Localités (structure organisationnelle). Seul endroit autorisé à connaître ses routes. */
export function useLocalitesApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<Localite>>("/localites", { query: params }),

    getById: (id: number) => api<ApiResponse<Localite>>(`/localites/${id}`),

    create: (payload: LocaliteInput) =>
      api<ApiResponse<Localite>>("/localites", { method: "POST", body: payload }),

    update: (id: number, payload: Partial<LocaliteInput>) =>
      api<ApiResponse<Localite>>(`/localites/${id}`, { method: "PUT", body: payload }),

    remove: (id: number) =>
      api<{ message: string }>(`/localites/${id}`, { method: "DELETE" }),

    // — Sous-ressource : administrations d'une localité ————————————
    administrations: (id: number) =>
      api<ApiCollection<Administration>>(`/localites/${id}/administrations`),
  };
}
