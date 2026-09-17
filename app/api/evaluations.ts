import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type {
  Evaluation,
  ContexteEvaluationInput,
  AvisEtSignerInput,
  ValidationRhInput,
  ReattributionSuperieurInput,
} from "~/schemas/evaluation";
import type { NoteEvaluationInput } from "~/schemas/note-evaluation";
import type { ReclamationInput } from "~/schemas/reclamation";
import type {
  ConnaissanceComplementaire,
  ConnaissanceComplementaireInput,
} from "~/schemas/connaissance-complementaire";

/**
 * Repository Fiches d'évaluation (`/avancements/evaluations`). Seul endroit
 * autorisé à connaître ces routes. Toutes les fonctions *throwent*.
 *
 * Deux règles de consommation, imposées par le backend :
 * 1. **Noter = un critère par appel** (`noter`) ; la réponse est la fiche
 *    entière recalculée (note globale + mention + statut).
 * 2. Les actions ne rechargent pas toutes les relations → **refetch `getById`**
 *    après chaque action pour garder la fiche complète à l'écran.
 *
 * Filtres serveur (égalité exacte) : `session_id`, `agent_id`, `superieur_id`,
 * `statut`, `inscrit_tableau`.
 */
export function useEvaluationsApi() {
  const api = useApiClient();

  return {
    /** Vue RH — toutes les fiches. */
    list: (params?: ListParams) =>
      api<ApiCollection<Evaluation>>("/avancements/evaluations", { query: params }),

    getById: (id: number) => api<ApiResponse<Evaluation>>(`/avancements/evaluations/${id}`),

    /** Fiches de l'agent connecté (déduit de `user.agent_id` côté serveur). */
    mesEvaluations: () =>
      api<ApiCollection<Evaluation>>("/avancements/evaluations/agent/mes-evaluations"),

    /** Fiches à noter par le notateur connecté. */
    aNoter: () =>
      api<ApiCollection<Evaluation>>("/avancements/evaluations/superieur/mes-evaluations"),

    // — Notateur (N+1) ———————————————————————————————————————————
    /** Note d'**un** critère (≤ `bareme_max`, sinon 422). Renvoie la fiche recalculée. */
    noter: (id: number, payload: NoteEvaluationInput) =>
      api<ApiResponse<Evaluation>>(`/avancements/evaluations/${id}/noter`, { method: "POST", body: payload }),

    /** Contexte de la fiche : absences non justifiées, sanctions, avis libre. */
    updateContexte: (id: number, payload: ContexteEvaluationInput) =>
      api<ApiResponse<Evaluation>>(`/avancements/evaluations/${id}/contexte`, { method: "PUT", body: payload }),

    /** Avis motivé + signature du notateur (avis ≥ 10 caractères — CCN art. 63). */
    avisEtSigner: (id: number, payload: AvisEtSignerInput) =>
      api<ApiResponse<Evaluation>>(`/avancements/evaluations/${id}/avis-et-signer`, { method: "POST", body: payload }),

    // — Agent évalué ——————————————————————————————————————————————
    /** Prise de connaissance et signature par l'agent (art. 63). */
    signerEvalue: (id: number) =>
      api<ApiResponse<Evaluation>>(`/avancements/evaluations/${id}/signer-evalue`, { method: "POST", body: {} }),

    /** Réclamation de l'agent (art. 65) — motif ≥ 10 caractères. */
    reclamer: (id: number, payload: ReclamationInput) =>
      api<ApiResponse<Evaluation>>(`/avancements/evaluations/${id}/reclamer`, { method: "POST", body: payload }),

    /** Transmission à la RH. 422 si un avis hiérarchique requis n'est pas signé. */
    envoyerRh: (id: number) =>
      api<ApiResponse<Evaluation>>(`/avancements/evaluations/${id}/envoyer-rh`, { method: "POST", body: {} }),

    // — RH ————————————————————————————————————————————————————————
    /** `conforme: true` → finalisée **et** inscrite au tableau ; `false` → rejetée. */
    validerRh: (id: number, payload: ValidationRhInput) =>
      api<ApiResponse<Evaluation>>(`/avancements/evaluations/${id}/valider-rh`, { method: "POST", body: payload }),

    annuler: (id: number, commentaire?: string) =>
      api<ApiResponse<Evaluation>>(`/avancements/evaluations/${id}/annuler`, {
        method: "POST",
        body: commentaire ? { commentaire } : {},
      }),

    /** Réattribue le notateur (`creer-evaluations`) — session ouverte, fiche non terminée. */
    reattribuerSuperieur: (id: number, payload: ReattributionSuperieurInput) =>
      api<ApiResponse<Evaluation>>(`/avancements/evaluations/${id}/superieur`, { method: "PUT", body: payload }),

    // — Tableau d'avancement (D5) ————————————————————————————————
    /** 422 si la commission d'avancement est clôturée ou a déjà décidé. */
    inscrireTableau: (id: number) =>
      api<ApiResponse<Evaluation>>(`/avancements/evaluations/${id}/inscrire-tableau`, { method: "POST", body: {} }),

    retirerTableau: (id: number) =>
      api<ApiResponse<Evaluation>>(`/avancements/evaluations/${id}/retirer-tableau`, { method: "POST", body: {} }),

    // — Connaissances complémentaires (besoins de formation) ————————
    connaissances: (id: number) =>
      api<ApiCollection<ConnaissanceComplementaire>>(`/avancements/evaluations/${id}/connaissances`),

    ajouterConnaissance: (id: number, payload: ConnaissanceComplementaireInput) =>
      api<ApiResponse<ConnaissanceComplementaire>>(`/avancements/evaluations/${id}/connaissances`, {
        method: "POST",
        body: payload,
      }),

    supprimerConnaissance: (connaissanceId: number) =>
      api<{ message: string }>(`/avancements/connaissances/${connaissanceId}`, { method: "DELETE" }),

    /** Fiche PDF — disponible dès la signature de l'agent (422 avant, 403 pour un tiers). */
    fichePdf: (id: number) =>
      api<Blob>(`/avancements/evaluations/${id}/fiche-pdf`, { responseType: "blob" }),
  };
}
