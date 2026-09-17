import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { TypeSanction, TypeSanctionInput } from "~/schemas/type-sanction";

/**
 * Repository Types de sanction (`/discipline/types-sanctions`, CCN art. 90).
 * Lecture : `consulter-discipline` **ou** `proposer-discipline` (un chef doit
 * pouvoir choisir un type en déposant son rapport). Écriture : `gerer-discipline`.
 *
 * Filtres serveur : `nom`, `gravite`, `actif`, `code`.
 *
 * ⚠️ Les quatre types CCN ne sont pas supprimables (422) : les désactiver.
 */
export function useTypesSanctionsApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<TypeSanction>>("/discipline/types-sanctions", { query: params }),

    getById: (id: number) => api<ApiResponse<TypeSanction>>(`/discipline/types-sanctions/${id}`),

    create: (payload: TypeSanctionInput) =>
      api<ApiResponse<TypeSanction>>("/discipline/types-sanctions", { method: "POST", body: payload }),

    update: (id: number, payload: Partial<TypeSanctionInput>) =>
      api<ApiResponse<TypeSanction>>(`/discipline/types-sanctions/${id}`, { method: "PUT", body: payload }),

    remove: (id: number) =>
      api<{ message: string }>(`/discipline/types-sanctions/${id}`, { method: "DELETE" }),
  };
}
