import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type {
  AvancementExceptionnel,
  AvancementExceptionnelInput,
} from "~/schemas/avancement-exceptionnel";
import type { TraitementBonificationInput } from "~/schemas/bonification-stage";

/**
 * Repository Avancements exceptionnels (CCN art. 72) : 1 ou 2 échelons accordés
 * par la commission d'avancement sur proposition du DG.
 *
 * Toutes les routes exigent `valider-evaluations` — y compris la proposition.
 * Le payload de décision est celui de la bonification (`{ approuver, commentaire }`).
 */
export function useAvancementsExceptionnelsApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<AvancementExceptionnel>>("/avancements/avancements-exceptionnels", { query: params }),

    enAttente: () =>
      api<ApiCollection<AvancementExceptionnel>>("/avancements/avancements-exceptionnels/en-attente"),

    create: (payload: AvancementExceptionnelInput) =>
      api<ApiResponse<AvancementExceptionnel>>("/avancements/avancements-exceptionnels", {
        method: "POST",
        body: payload,
      }),

    traiter: (id: number, payload: TraitementBonificationInput) =>
      api<ApiResponse<AvancementExceptionnel>>(`/avancements/avancements-exceptionnels/${id}/traiter`, {
        method: "POST",
        body: payload,
      }),

    /** Applique les échelons en paie (idempotent). */
    appliquer: (id: number) =>
      api<ApiResponse<{ avance: boolean; message?: string }>>(
        `/avancements/avancements-exceptionnels/${id}/appliquer`,
        { method: "POST", body: {} },
      ),
  };
}
