import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { TypeIntegration, TypeIntegrationInput } from "~/schemas/type-integration";
import type {
  CircuitValidation,
  CircuitAjouterNiveau,
  CircuitRemplacer,
} from "~/schemas/circuit-validation";

/** Repository Types d'intégration (référentiel). Seul endroit autorisé à connaître ses routes. */
export function useTypesIntegrationsApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<TypeIntegration>>("/types-integrations", { query: params }),

    getById: (id: number) =>
      api<ApiResponse<TypeIntegration>>(`/types-integrations/${id}`),

    create: (payload: TypeIntegrationInput) =>
      api<ApiResponse<TypeIntegration>>("/types-integrations", {
        method: "POST",
        body: payload,
      }),

    update: (id: number, payload: Partial<TypeIntegrationInput>) =>
      api<ApiResponse<TypeIntegration>>(`/types-integrations/${id}`, {
        method: "PUT",
        body: payload,
      }),

    remove: (id: number) =>
      api<{ message: string }>(`/types-integrations/${id}`, { method: "DELETE" }),

    // — Circuit de validation configurable par type d'intégration ————
    circuit: (typeId: number) =>
      api<ApiCollection<CircuitValidation>>(`/types-integrations/${typeId}/circuit`),

    remplacerCircuit: (typeId: number, payload: CircuitRemplacer) =>
      api<ApiCollection<CircuitValidation>>(`/types-integrations/${typeId}/circuit`, {
        method: "PUT",
        body: payload,
      }),

    ajouterNiveau: (typeId: number, payload: CircuitAjouterNiveau) =>
      api<ApiResponse<CircuitValidation>>(`/types-integrations/${typeId}/circuit`, {
        method: "POST",
        body: payload,
      }),

    retirerNiveau: (typeId: number, stepId: number) =>
      api<{ message: string }>(`/types-integrations/${typeId}/circuit/${stepId}`, {
        method: "DELETE",
      }),
  };
}
