import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type {
  ParametreApplication,
  ParametreApplicationInput,
} from "~/schemas/parametre-application";

/**
 * Repository des paramètres applicatifs (administration système).
 * Seul endroit qui connaît les routes `/parametres-application`.
 */
export function useParametresApplicationApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<ParametreApplication>>("/parametres-application", {
        query: params,
      }),

    getById: (id: number) =>
      api<ApiResponse<ParametreApplication>>(`/parametres-application/${id}`),

    create: (payload: ParametreApplicationInput) =>
      api<ApiResponse<ParametreApplication>>("/parametres-application", {
        method: "POST",
        body: payload,
      }),

    update: (id: number, payload: Partial<ParametreApplicationInput>) =>
      api<ApiResponse<ParametreApplication>>(`/parametres-application/${id}`, {
        method: "PUT",
        body: payload,
      }),

    remove: (id: number) =>
      api<{ message: string }>(`/parametres-application/${id}`, {
        method: "DELETE",
      }),
  };
}
