import type { ApiResponse } from "~/types/api";
import type { PriseDeService, PriseDeServiceInput } from "~/schemas/prise-de-service";

/**
 * Repository Prises de service (étape finale). Seul endroit autorisé à
 * connaître la route prises-de-service. Tout vit sous `/integration` et
 * requiert l'auth. Toutes les fonctions throwent en cas d'erreur.
 */
export function usePrisesDeServiceApi() {
  const api = useApiClient();

  return {
    create: (payload: PriseDeServiceInput) =>
      api<ApiResponse<PriseDeService>>("/integration/prises-de-service", {
        method: "POST",
        body: payload,
      }),
  };
}
