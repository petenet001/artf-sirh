import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type {
  SessionEvaluation,
  SessionEvaluationInput,
  StatsSession,
} from "~/schemas/session-evaluation";
import type { AgentSummary } from "~/schemas/agent-summary";
import type { Evaluation } from "~/schemas/evaluation";

/**
 * Repository Sessions d'évaluation (`/avancements/sessions`). Une session = un
 * cycle de notation : son **ouverture génère automatiquement** les fiches des
 * agents éligibles (statut actif, cycle 24 mois, parité d'année, semestre, N+1
 * identifiable sur le poste dominant — CCN art. 62).
 *
 * Lecture `consulter-evaluations`, écriture `creer-evaluations` (RH).
 * Filtres serveur : `statut`, `type_annee`.
 */
export function useSessionsEvaluationApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<SessionEvaluation>>("/avancements/sessions", { query: params }),

    getById: (id: number) => api<ApiResponse<SessionEvaluation>>(`/avancements/sessions/${id}`),

    create: (payload: SessionEvaluationInput) =>
      api<ApiResponse<SessionEvaluation>>("/avancements/sessions", { method: "POST", body: payload }),

    update: (id: number, payload: Partial<SessionEvaluationInput>) =>
      api<ApiResponse<SessionEvaluation>>(`/avancements/sessions/${id}`, { method: "PUT", body: payload }),

    /** Clôture : refusée (422) si les commissions ouvertes ne sont pas clôturées. */
    cloturer: (id: number) =>
      api<ApiResponse<SessionEvaluation>>(`/avancements/sessions/${id}/cloturer`, { method: "POST", body: {} }),

    /** Annulation : annule aussi les fiches encore `en_attente` / `en_cours`. */
    annuler: (id: number) =>
      api<ApiResponse<SessionEvaluation>>(`/avancements/sessions/${id}/annuler`, { method: "POST", body: {} }),

    /** Regénère les fiches manquantes (après correction d'une affectation, p. ex.). */
    genererFiches: (id: number) =>
      api<ApiResponse<SessionEvaluation>>(`/avancements/sessions/${id}/generer-fiches`, { method: "POST", body: {} }),

    /**
     * Agents éligibles **sans N+1 identifiable** : aucune fiche n'a été créée
     * pour eux. À corriger côté affectations, puis `genererFiches`.
     */
    sansSuperieur: (id: number) =>
      api<ApiCollection<AgentSummary>>(`/avancements/sessions/${id}/sans-superieur`),

    /** Compteurs de la session (`total`, `par_statut`, `moyenne`, `mentions`). */
    stats: (id: number) => api<ApiResponse<StatsSession>>(`/avancements/sessions/${id}/stats`),

    /** Tableau d'avancement : fiches `finalisee` **et** inscrites (D5). */
    tableau: (id: number) =>
      api<ApiCollection<Evaluation>>(`/avancements/sessions/${id}/tableau`),
  };
}
