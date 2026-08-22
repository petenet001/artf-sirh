import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type {
  Classegrillesalariale,
  ClassegrillesalarialeInput,
} from "~/schemas/classegrillesalariale";

/**
 * Repository des classes de la grille salariale.
 * Seul endroit qui connaît les routes `/grille-classes`.
 */
export function useGrilleClassesApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<Classegrillesalariale>>("/grille-classes", {
        query: params,
      }),

    getById: (id: number) =>
      api<ApiResponse<Classegrillesalariale>>(`/grille-classes/${id}`),

    create: (payload: ClassegrillesalarialeInput) =>
      api<ApiResponse<Classegrillesalariale>>("/grille-classes", {
        method: "POST",
        body: payload,
      }),

    update: (id: number, payload: Partial<ClassegrillesalarialeInput>) =>
      api<ApiResponse<Classegrillesalariale>>(`/grille-classes/${id}`, {
        method: "PUT",
        body: payload,
      }),

    remove: (id: number) =>
      api<{ message: string }>(`/grille-classes/${id}`, { method: "DELETE" }),
  };
}
