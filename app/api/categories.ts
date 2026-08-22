import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { Categorie, CategorieInput } from "~/schemas/categorie";

/** Repository Catégories (référentiel RH). Seul endroit autorisé à connaître ses routes. */
export function useCategoriesApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<Categorie>>("/categories", { query: params }),

    getById: (id: number) => api<ApiResponse<Categorie>>(`/categories/${id}`),

    create: (payload: CategorieInput) =>
      api<ApiResponse<Categorie>>("/categories", { method: "POST", body: payload }),

    update: (id: number, payload: Partial<CategorieInput>) =>
      api<ApiResponse<Categorie>>(`/categories/${id}`, { method: "PUT", body: payload }),

    remove: (id: number) =>
      api<{ message: string }>(`/categories/${id}`, { method: "DELETE" }),
  };
}
