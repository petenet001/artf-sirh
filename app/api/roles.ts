import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { Role, RoleInput } from "~/schemas/role";

/**
 * Repository des rôles (administration système).
 * Seul endroit qui connaît les routes `/roles`.
 */
export function useRolesApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<Role>>("/roles", { query: params }),

    getById: (id: number) => api<ApiResponse<Role>>(`/roles/${id}`),

    create: (payload: RoleInput) =>
      api<ApiResponse<Role>>("/roles", { method: "POST", body: payload }),

    update: (id: number, payload: Partial<RoleInput>) =>
      api<ApiResponse<Role>>(`/roles/${id}`, {
        method: "PUT",
        body: payload,
      }),

    remove: (id: number) =>
      api<{ message: string }>(`/roles/${id}`, { method: "DELETE" }),

    dupliquer: (id: number) =>
      api<ApiResponse<Role>>(`/roles/${id}/dupliquer`, { method: "POST" }),

    assignPermissions: (id: number, payload: { permissions: string[] }) =>
      api<ApiResponse<Role>>(`/roles/${id}/permissions`, {
        method: "POST",
        body: payload,
      }),
  };
}
