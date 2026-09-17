import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type {
  BonificationStage,
  BonificationStageInput,
  TraitementBonificationInput,
} from "~/schemas/bonification-stage";

/**
 * Repository Bonifications de stage (CCN art. 71) : +2 échelons pour un stage
 * autorisé d'au moins 9 mois. Parcours séparé du cycle de notation.
 *
 * Permissions : le dépôt demande `consulter-evaluations` (l'agent peut donc
 * soumettre) ; lecture de la file, décision et application demandent
 * `valider-evaluations` — réserver ces écrans au rôle RH.
 */
export function useBonificationsStageApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<BonificationStage>>("/avancements/bonifications-stage", { query: params }),

    enAttente: () =>
      api<ApiCollection<BonificationStage>>("/avancements/bonifications-stage/en-attente"),

    /** 422 si la durée calculée est inférieure à 9 mois. */
    create: (payload: BonificationStageInput) =>
      api<ApiResponse<BonificationStage>>("/avancements/bonifications-stage", {
        method: "POST",
        body: payload,
      }),

    traiter: (id: number, payload: TraitementBonificationInput) =>
      api<ApiResponse<BonificationStage>>(`/avancements/bonifications-stage/${id}/traiter`, {
        method: "POST",
        body: payload,
      }),

    /** Applique les échelons en paie (idempotent). */
    appliquer: (id: number) =>
      api<ApiResponse<{ avance: boolean; message?: string }>>(
        `/avancements/bonifications-stage/${id}/appliquer`,
        { method: "POST", body: {} },
      ),
  };
}
