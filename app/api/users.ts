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

    /**
     * Vague F — rattache l'utilisateur à un bureau DRHL, ou change son bureau.
     *
     * Le rattachement ne donne **aucun droit** : il en retire. Les listes
     * renvoyées par l'API (agents, congés, absences, sanctions) sont alors
     * réduites au périmètre de la structure du bureau. Réservé à
     * `modifier-utilisateurs`.
     */
    rattacherBureau: (id: number, bureauId: number) =>
      api<ApiResponse<User>>(`/users/${id}/bureau`, {
        method: "POST",
        body: { bureau_id: bureauId },
      }),

    /** Retire le cloisonnement : l'utilisateur retrouve un périmètre global. */
    retirerBureau: (id: number) =>
      api<ApiResponse<User>>(`/users/${id}/bureau`, { method: "DELETE" }),
  };
}
