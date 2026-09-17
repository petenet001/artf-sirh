import type { ApiResponse, ApiCollection } from "~/types/api";
import type {
  Commission,
  OuvrirCommissionInput,
  CloturerCommissionInput,
  NoterCommissionInput,
  DeciderCommissionInput,
  ResultatNotationCommission,
  ResultatAvancement,
} from "~/schemas/commission";
import type { Evaluation } from "~/schemas/evaluation";

/**
 * Repository Commissions d'évaluation (CCN art. 68–70).
 *
 * Séquence imposée par l'API — chaque étape refuse (422) tant que la précédente
 * n'est pas bouclée :
 * `commission préparatoire` (ouvrir → noter → clôturer → synthèse PDF)
 * → `commission d'avancement` (ouvrir → décider → clôturer)
 * → `avancerEchelon` par fiche → clôture de la session.
 *
 * Les deux commissions s'ouvrent et se lisent **par session**, puis s'actionnent
 * par leur propre id.
 */
export function useCommissionsApi() {
  const api = useApiClient();

  return {
    // — Commission préparatoire (art. 68) ————————————————————————
    preparatoireParSession: (sessionId: number) =>
      api<ApiResponse<Commission | null>>(`/avancements/sessions/${sessionId}/commission-preparatoire`),

    ouvrirPreparatoire: (sessionId: number, payload?: OuvrirCommissionInput) =>
      api<ApiResponse<Commission>>(`/avancements/sessions/${sessionId}/commission-preparatoire`, {
        method: "POST",
        body: payload ?? {},
      }),

    /** Harmonise la note d'une fiche et consigne la synthèse (art. 67). */
    noterPreparatoire: (id: number, payload: NoterCommissionInput) =>
      api<ApiResponse<ResultatNotationCommission>>(`/avancements/commissions-preparatoires/${id}/noter`, {
        method: "POST",
        body: payload,
      }),

    /** Fiches dont l'écart |note commission − note N+1| dépasse 5 points. */
    alertesPreparatoire: (id: number) =>
      api<ApiCollection<Evaluation>>(`/avancements/commissions-preparatoires/${id}/alertes`),

    cloturerPreparatoire: (id: number, payload?: CloturerCommissionInput) =>
      api<ApiResponse<Commission>>(`/avancements/commissions-preparatoires/${id}/cloturer`, {
        method: "POST",
        body: payload ?? {},
      }),

    /** Note de synthèse PDF (art. 67) — après clôture seulement, RH / admin / DG. */
    synthesePdf: (id: number) =>
      api<Blob>(`/avancements/commissions-preparatoires/${id}/synthese-pdf`, { responseType: "blob" }),

    // — Commission d'avancement (art. 69–70) ——————————————————————
    avancementParSession: (sessionId: number) =>
      api<ApiResponse<Commission | null>>(`/avancements/sessions/${sessionId}/commission-avancement`),

    /** Refusée (422) si la commission préparatoire n'est pas clôturée. */
    ouvrirAvancement: (sessionId: number, payload?: OuvrirCommissionInput) =>
      api<ApiResponse<Commission>>(`/avancements/sessions/${sessionId}/commission-avancement`, {
        method: "POST",
        body: payload ?? {},
      }),

    /** Décision par fiche. 422 si la fiche a été retirée du tableau. */
    decider: (id: number, payload: DeciderCommissionInput) =>
      api<ApiResponse<Evaluation>>(`/avancements/commissions-avancements/${id}/decider`, {
        method: "POST",
        body: payload,
      }),

    cloturerAvancement: (id: number, payload?: CloturerCommissionInput) =>
      api<ApiResponse<Commission>>(`/avancements/commissions-avancements/${id}/cloturer`, {
        method: "POST",
        body: payload ?? {},
      }),

    /** Applique l'échelon en paie (idempotent : `avance: false` si déjà fait). */
    avancerEchelon: (evaluationId: number) =>
      api<ApiResponse<ResultatAvancement>>(`/avancements/evaluations/${evaluationId}/avancer-echelon`, {
        method: "POST",
        body: {},
      }),
  };
}
