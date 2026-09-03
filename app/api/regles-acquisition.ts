import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { RegleAcquisition, RegleAcquisitionInput } from "~/schemas/regle-acquisition";

/**
 * Repository Règles d'acquisition de congés (paramétrage RH, sous `/conges`).
 * Lecture `consulter-conges` ; écriture `valider-conges`. Compatible
 * `BaseCrudManager`.
 */
export function useReglesAcquisitionApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<RegleAcquisition>>("/conges/regles-acquisition", { query: params }),

    create: (payload: RegleAcquisitionInput) =>
      api<ApiResponse<RegleAcquisition>>("/conges/regles-acquisition", { method: "POST", body: payload }),

    update: (id: number, payload: Partial<RegleAcquisitionInput>) =>
      api<ApiResponse<RegleAcquisition>>(`/conges/regles-acquisition/${id}`, { method: "PUT", body: payload }),

    remove: (id: number) =>
      api<{ message: string }>(`/conges/regles-acquisition/${id}`, { method: "DELETE" }),
  };
}
