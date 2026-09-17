import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { QuestionEvaluation, QuestionEvaluationInput } from "~/schemas/question-evaluation";

/**
 * Repository Grille de critères d'évaluation (`/avancements/questions-evaluation`).
 * Lecture : `consulter-evaluations` (tout notateur en a besoin pour noter) ;
 * écriture : `creer-evaluations` (RH).
 *
 * Filtres serveur (égalité exacte) : `type_critere`, `actif`.
 *
 * ⚠️ `remove` efface les notes déjà saisies sur ce critère : préférer une mise à
 * jour `{ actif: false }`, qui retire le critère des futures notations sans
 * toucher à l'historique.
 */
export function useQuestionsEvaluationApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<QuestionEvaluation>>("/avancements/questions-evaluation", { query: params }),

    getById: (id: number) =>
      api<ApiResponse<QuestionEvaluation>>(`/avancements/questions-evaluation/${id}`),

    create: (payload: QuestionEvaluationInput) =>
      api<ApiResponse<QuestionEvaluation>>("/avancements/questions-evaluation", {
        method: "POST",
        body: payload,
      }),

    update: (id: number, payload: Partial<QuestionEvaluationInput>) =>
      api<ApiResponse<QuestionEvaluation>>(`/avancements/questions-evaluation/${id}`, {
        method: "PUT",
        body: payload,
      }),

    remove: (id: number) =>
      api<{ message: string }>(`/avancements/questions-evaluation/${id}`, { method: "DELETE" }),
  };
}
