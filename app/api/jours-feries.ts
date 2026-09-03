import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { JourFerie, JourFerieInput } from "~/schemas/jour-ferie";

/**
 * Repository Jours fériés (paramétrage RH, sous `/conges`). Lecture avec
 * `consulter-conges` ; écriture avec `valider-conges`. Compatible `BaseCrudManager`.
 */
export function useJoursFeriesApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<JourFerie>>("/conges/jours-feries", { query: params }),

    create: (payload: JourFerieInput) =>
      api<ApiResponse<JourFerie>>("/conges/jours-feries", { method: "POST", body: payload }),

    update: (id: number, payload: Partial<JourFerieInput>) =>
      api<ApiResponse<JourFerie>>(`/conges/jours-feries/${id}`, { method: "PUT", body: payload }),

    remove: (id: number) =>
      api<{ message: string }>(`/conges/jours-feries/${id}`, { method: "DELETE" }),
  };
}
