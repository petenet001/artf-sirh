import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { Direction, DirectionInput } from "~/schemas/direction";
import type { Service } from "~/schemas/service";

/** Repository Directions (structure organisationnelle). Seul endroit autorisé à connaître ses routes. */
export function useDirectionsApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<Direction>>("/directions", { query: params }),

    getById: (id: number) => api<ApiResponse<Direction>>(`/directions/${id}`),

    create: (payload: DirectionInput) =>
      api<ApiResponse<Direction>>("/directions", { method: "POST", body: payload }),

    update: (id: number, payload: Partial<DirectionInput>) =>
      api<ApiResponse<Direction>>(`/directions/${id}`, { method: "PUT", body: payload }),

    remove: (id: number) =>
      api<{ message: string }>(`/directions/${id}`, { method: "DELETE" }),

    // — Sous-ressource : services d'une direction ————————————————
    services: (id: number) =>
      api<ApiCollection<Service>>(`/directions/${id}/services`),
  };
}
