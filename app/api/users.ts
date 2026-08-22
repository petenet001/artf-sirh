import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { User, UserInput } from "~/schemas/user";

/**
 * Repository des utilisateurs (administration système).
 * Seul endroit qui connaît les routes `/users`.
 */
export function useUsersApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<User>>("/users", { query: params }),

    getById: (id: number) => api<ApiResponse<User>>(`/users/${id}`),

    create: (payload: UserInput) =>
      api<ApiResponse<User>>("/users", { method: "POST", body: payload }),

    update: (id: number, payload: Partial<UserInput>) =>
      api<ApiResponse<User>>(`/users/${id}`, {
        method: "PUT",
        body: payload,
      }),

    remove: (id: number) =>
      api<{ message: string }>(`/users/${id}`, { method: "DELETE" }),
  };
}
