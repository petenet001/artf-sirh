import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { TypeContrat, TypeContratInput } from "~/schemas/type-contrat";

/** Repository Types de contrat (référentiel). Seul endroit autorisé à connaître ses routes. */
export function useTypesContratsApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<TypeContrat>>("/types-contrats", { query: params }),

    getById: (id: number) => api<ApiResponse<TypeContrat>>(`/types-contrats/${id}`),

    create: (payload: TypeContratInput) =>
      api<ApiResponse<TypeContrat>>("/types-contrats", { method: "POST", body: payload }),

    update: (id: number, payload: Partial<TypeContratInput>) =>
      api<ApiResponse<TypeContrat>>(`/types-contrats/${id}`, {
        method: "PUT",
        body: payload,
      }),

    remove: (id: number) =>
      api<{ message: string }>(`/types-contrats/${id}`, { method: "DELETE" }),
  };
}
