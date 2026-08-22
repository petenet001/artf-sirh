import type { ApiResponse } from "~/types/api";
import type {
  ValidationWorkflow,
  ValidationDecisionInput,
  ValidationRejectionInput,
} from "~/schemas/validation-workflow";

/**
 * Repository Validations (circuit de workflow). Seul endroit autorisé à
 * connaître les routes validations. Tout vit sous `/integration` et requiert
 * l'auth. Toutes les fonctions throwent en cas d'erreur.
 */
export function useValidationsApi() {
  const api = useApiClient();

  return {
    approuver: (id: number, payload?: ValidationDecisionInput) =>
      api<ApiResponse<ValidationWorkflow>>(`/integration/validations/${id}/approuver`, {
        method: "POST",
        body: payload ?? {},
      }),

    rejeter: (id: number, payload: ValidationRejectionInput) =>
      api<ApiResponse<ValidationWorkflow>>(`/integration/validations/${id}/rejeter`, {
        method: "POST",
        body: payload,
      }),

    renvoyer: (id: number, payload?: ValidationDecisionInput) =>
      api<ApiResponse<ValidationWorkflow>>(`/integration/validations/${id}/renvoyer`, {
        method: "POST",
        body: payload ?? {},
      }),
  };
}
