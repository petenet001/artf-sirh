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

    attestation: (id: number) =>
      api<Blob>(`/integration/stages/${id}/attestation`, { responseType: "blob" }),
  };
}
