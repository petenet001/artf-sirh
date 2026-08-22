import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { Administration, AdministrationInput } from "~/schemas/administration";
import type { Direction } from "~/schemas/direction";

/** Repository Administrations (structure organisationnelle). Seul endroit autorisé à connaître ses routes. */
export function useAdministrationsApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<Administration>>("/administrations", { query: params }),

    getById: (id: number) => api<ApiResponse<Administration>>(`/administrations/${id}`),

    create: (payload: AdministrationInput) =>
      api<ApiResponse<Administration>>("/administrations", {
        method: "POST",
        body: payload,
      }),

    update: (id: number, payload: Partial<AdministrationInput>) =>
      api<ApiResponse<Administration>>(`/administrations/${id}`, {
        method: "PUT",
        body: payload,
      }),

    remove: (id: number) =>
      api<{ message: string }>(`/administrations/${id}`, { method: "DELETE" }),

    // — Sous-ressource : directions d'une administration ————————————
    directions: (id: number) =>
      api<ApiCollection<Direction>>(`/administrations/${id}/directions`),
  };
}
