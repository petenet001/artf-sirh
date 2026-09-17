import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { Reclamation, TraitementReclamationInput } from "~/schemas/reclamation";

/**
 * Repository Réclamations d'évaluation (`/avancements/reclamations`, CCN art. 65).
 * Toutes les routes exigent `valider-evaluations` — permission détenue par
 * **tous les chefs** : réserver l'écran au rôle `rh` / `admin`.
 *
 * Traitement : `acceptee: true` renvoie la fiche au notateur (`en_cours`),
 * `false` maintient la note et l'envoie en validation RH.
 */
export function useReclamationsApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<Reclamation>>("/avancements/reclamations", { query: params }),

    /** File de travail RH : réclamations non encore tranchées. */
    enAttente: () => api<ApiCollection<Reclamation>>("/avancements/reclamations/en-attente"),

    getById: (id: number) => api<ApiResponse<Reclamation>>(`/avancements/reclamations/${id}`),

    traiter: (id: number, payload: TraitementReclamationInput) =>
      api<ApiResponse<Reclamation>>(`/avancements/reclamations/${id}/traiter`, {
        method: "POST",
        body: payload,
      }),
  };
}
