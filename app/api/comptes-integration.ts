import type { ApiResponse } from "~/types/api";
import type {
  CompteIntegration,
  CompteProvisionnerInput,
} from "~/schemas/compte-integration";

/**
 * Repository Comptes d'intégration. Seul endroit autorisé à connaître la
 * route de provisionnement. Tout vit sous `/integration` et requiert l'auth.
 * Toutes les fonctions throwent en cas d'erreur.
 */
export function useComptesIntegrationApi() {
  const api = useApiClient();

  return {
    provisionner: (payload: CompteProvisionnerInput) =>
      api<ApiResponse<CompteIntegration>>("/integration/comptes/provisionner", {
        method: "POST",
        body: payload,
      }),
  };
}
