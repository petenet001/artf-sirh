import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { Service, ServiceInput } from "~/schemas/service";
import type { Bureau } from "~/schemas/bureau";

/** Repository Services (structure organisationnelle). Seul endroit autorisé à connaître ses routes. */
export function useServicesApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<Service>>("/services", { query: params }),

    getById: (id: number) => api<ApiResponse<Service>>(`/services/${id}`),

    create: (payload: ServiceInput) =>
      api<ApiResponse<Service>>("/services", { method: "POST", body: payload }),

    update: (id: number, payload: Partial<ServiceInput>) =>
      api<ApiResponse<Service>>(`/services/${id}`, { method: "PUT", body: payload }),

    remove: (id: number) =>
      api<{ message: string }>(`/services/${id}`, { method: "DELETE" }),

    // — Sous-ressource : bureaux d'un service ————————————————————
    bureaux: (id: number) =>
      api<ApiCollection<Bureau>>(`/services/${id}/bureaux`),
  };
}
