import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type {
  MotifAdministratif,
  MotifAdministratifInput,
} from "~/schemas/motif-administratif";

/** Repository Motifs administratifs (référentiel). Seul endroit autorisé à connaître ses routes. */
export function useMotifsAdministratifsApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<MotifAdministratif>>("/motifs-administratifs", { query: params }),

    getById: (id: number) =>
      api<ApiResponse<MotifAdministratif>>(`/motifs-administratifs/${id}`),

    create: (payload: MotifAdministratifInput) =>
      api<ApiResponse<MotifAdministratif>>("/motifs-administratifs", {
        method: "POST",
        body: payload,
      }),

    update: (id: number, payload: Partial<MotifAdministratifInput>) =>
      api<ApiResponse<MotifAdministratif>>(`/motifs-administratifs/${id}`, {
        method: "PUT",
        body: payload,
      }),

    remove: (id: number) =>
      api<{ message: string }>(`/motifs-administratifs/${id}`, { method: "DELETE" }),
  };
}
