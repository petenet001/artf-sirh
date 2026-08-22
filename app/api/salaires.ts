import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { Salaire, SalaireGenerate } from "~/schemas/salaire";

/**
 * Repository de la grille salariale calculée.
 * Seul endroit qui connaît les routes `/salaires`.
 */
export function useSalairesApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<Salaire>>("/salaires", { query: params }),

    /**
     * Génère (ou régénère) la grille complète.
     * Le contrôleur renvoie `{ data: null, message }` (pas de collection).
     */
    generate: (payload: SalaireGenerate) =>
      api<ApiResponse<null>>("/salaires/generation", {
        method: "POST",
        body: payload,
      }),
  };
}
