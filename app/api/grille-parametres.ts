import type { ApiResponse } from "~/types/api";
import type {
  Parametregrille,
  ParametregrilleInput,
} from "~/schemas/parametregrille";

/**
 * Repository des paramètres de la grille salariale (singleton).
 * Seul endroit qui connaît les routes `/grille-parametres`.
 */
export function useGrilleParametresApi() {
  const api = useApiClient();

  return {
    current: () =>
      api<ApiResponse<Parametregrille>>("/grille-parametres/current"),

    update: (id: number, payload: Partial<ParametregrilleInput>) =>
      api<ApiResponse<Parametregrille>>(`/grille-parametres/${id}`, {
        method: "PUT",
        body: payload,
      }),
  };
}
