import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type {
  ConventionStage,
  StageProlonger,
  StageCloturer,
} from "~/schemas/convention-stage";

/**
 * Repository des conventions de stage. Seul endroit qui connaît ces routes
 * (préfixe `/integration`, authentifié). L'attestation est un PDF (blob).
 * Attention : `prolonger` est un **PATCH**.
 */
export function useStagesApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<ConventionStage>>("/integration/stages", { query: params }),

    getById: (id: number) => api<ApiResponse<ConventionStage>>(`/integration/stages/${id}`),

    prolonger: (id: number, payload: StageProlonger) =>
      api<ApiResponse<ConventionStage>>(`/integration/stages/${id}/prolonger`, {
        method: "PATCH",
        body: payload,
      }),

    cloturer: (id: number, payload: StageCloturer) =>
      api<ApiResponse<ConventionStage>>(`/integration/stages/${id}/cloturer`, {
        method: "POST",
        body: payload,
      }),

    /**
     * Ouvre un dossier d'intégration « Recrutement externe » en brouillon sur
     * l'agent du stage (CCN, D.4). Le stage doit être **clôturé** ; un second
     * appel renvoie 422. Le wizard d'intégration prend ensuite le relais.
     */
    convertirAgent: (id: number) =>
      api<ApiResponse<ConventionStage>>(`/integration/stages/${id}/convertir-agent`, {
        method: "POST",
        body: {},
      }),

    attestation: (id: number) =>
      api<Blob>(`/integration/stages/${id}/attestation`, { responseType: "blob" }),
  };
}
