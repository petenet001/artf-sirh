import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { PieceDossierSocial, AccorderInput } from "~/schemas/dossier-social";

/**
 * Fabrique de repository pour les **dossiers sociaux instruits**.
 *
 * Prestations (D.3.4), prises en charge et arrêts de santé (D.3.5) exposent
 * exactement les mêmes dix-huit routes, au segment d'URL près :
 *
 * ```
 * GET|POST        /affaires-sociales/<segment>
 * GET|PUT|DELETE  /affaires-sociales/<segment>/{id}
 * POST            /affaires-sociales/<segment>/{id}/{soumettre|instruire|accorder|refuser|classer}
 * GET|POST        /affaires-sociales/<segment>/{id}/pieces
 * GET|DELETE      /affaires-sociales/<segment>/{id}/pieces/{pieceId}
 * GET             /affaires-sociales/<segment>/{id}/{simulation|pdf-decision}
 * GET             /affaires-sociales/agents/{agentId}/<segment>
 * ```
 *
 * Les décrire trois fois serait trois fois la même correction à faire le jour
 * où une route bouge. La fabrique est générique sur le type de la ressource et
 * sur celui de son payload de création, si bien que chaque repository concret
 * reste entièrement typé.
 *
 * Elle ne contient **que** ce qui est commun : ce qui est propre à un dossier
 * (le calcul d'une simulation, par exemple) s'ajoute dans son propre fichier.
 */
export function dossierSocialApi<T, TInput extends Record<string, unknown>>(segment: string) {
  const api = useApiClient();
  const base = `/affaires-sociales/${segment}`;

  return {
    list: (params?: ListParams) => api<ApiCollection<T>>(base, { query: params }),

    byAgent: (agentId: number) =>
      api<ApiCollection<T>>(`/affaires-sociales/agents/${agentId}/${segment}`),

    getById: (id: number) => api<ApiResponse<T>>(`${base}/${id}`),

    create: (payload: TInput) => api<ApiResponse<T>>(base, { method: "POST", body: payload }),

    update: (id: number, payload: Partial<TInput>) =>
      api<ApiResponse<T>>(`${base}/${id}`, { method: "PUT", body: payload }),

    remove: (id: number) => api<{ message: string }>(`${base}/${id}`, { method: "DELETE" }),

    // ── Circuit ───────────────────────────────────────────────────────────
    // Chaque transition renvoie le dossier remis à jour : on réaffecte la
    // réponse plutôt que de relancer un `getById`.

    soumettre: (id: number) => api<ApiResponse<T>>(`${base}/${id}/soumettre`, { method: "POST" }),

    instruire: (id: number, notes: string) =>
      api<ApiResponse<T>>(`${base}/${id}/instruire`, {
        method: "POST",
        body: { notes_instruction: notes },
      }),

    accorder: (id: number, payload: AccorderInput = {}) =>
      api<ApiResponse<T>>(`${base}/${id}/accorder`, { method: "POST", body: payload }),

    refuser: (id: number, commentaire: string) =>
      api<ApiResponse<T>>(`${base}/${id}/refuser`, { method: "POST", body: { commentaire } }),

    classer: (id: number, commentaire?: string | null) =>
      api<ApiResponse<T>>(`${base}/${id}/classer`, { method: "POST", body: { commentaire } }),

    // ── Pièces justificatives ─────────────────────────────────────────────

    pieces: (id: number) => api<ApiCollection<PieceDossierSocial>>(`${base}/${id}/pieces`),

    /**
     * Dépôt d'une pièce. `FormData` obligatoire (fichier) ; on ne force jamais
     * le `Content-Type`, `$fetch` pose lui-même la frontière multipart.
     */
    ajouterPiece: (id: number, fichier: File, typePiece: string) => {
      const fd = new FormData();
      fd.append("fichier", fichier);
      fd.append("type_piece", typePiece);
      return api<ApiResponse<PieceDossierSocial>>(`${base}/${id}/pieces`, {
        method: "POST",
        body: fd,
      });
    },

    telechargerPiece: (id: number, pieceId: number) =>
      api<Blob>(`${base}/${id}/pieces/${pieceId}`, { responseType: "blob" }),

    supprimerPiece: (id: number, pieceId: number) =>
      api<{ message: string }>(`${base}/${id}/pieces/${pieceId}`, { method: "DELETE" }),

    // ── Aide à la décision ────────────────────────────────────────────────

    /** Barème CCN appliqué au dossier, avant que la décision ne le fige. */
    simulation: (id: number) => api<ApiResponse<unknown>>(`${base}/${id}/simulation`),

    /** PDF de la décision (accord ou refus) — disponible une fois décidé. */
    pdfDecision: (id: number) =>
      api<Blob>(`${base}/${id}/pdf-decision`, { responseType: "blob" }),
  };
}
