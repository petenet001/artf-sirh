import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type {
  Affectation,
  AffectationInput,
  AffectationGroupeeInput,
  LotAffectation,
} from "~/schemas/affectation";

/**
 * Repository Affectations (module carrière). Seul endroit autorisé à connaître
 * les routes affectations. Préfixe canonique `/carriere` (les alias
 * `/integration` restent acceptés côté API mais on ne les cible plus).
 * Toutes les fonctions throwent en cas d'erreur.
 *
 * ⚠️ Activer une affectation ne change plus le statut du dossier d'intégration :
 * `dossier_integration_id` est encore accepté mais ignoré par l'API.
 */
export function useAffectationsApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<Affectation>>("/carriere/affectations", { query: params }),

    getById: (id: number) =>
      api<ApiResponse<Affectation>>(`/carriere/affectations/${id}`),

    byAgent: (agentId: number) =>
      api<ApiCollection<Affectation>>(`/carriere/agents/${agentId}/affectations`),

    create: (payload: AffectationInput) =>
      api<ApiResponse<Affectation>>("/carriere/affectations", {
        method: "POST",
        body: payload,
      }),

    activer: (id: number, payload?: { dossier_integration_id?: number }) =>
      api<ApiResponse<Affectation>>(`/carriere/affectations/${id}/activer`, {
        method: "POST",
        body: payload ?? {},
      }),

    rejeter: (id: number) =>
      api<ApiResponse<Affectation>>(`/carriere/affectations/${id}/rejeter`, {
        method: "POST",
      }),

    terminer: (id: number) =>
      api<ApiResponse<Affectation>>(`/carriere/affectations/${id}/terminer`, {
        method: "POST",
      }),

    noteService: (id: number) =>
      api<Blob>(`/carriere/affectations/${id}/note-service`, { responseType: "blob" }),

    // — Lot groupé (un circuit, un acte) ——————————————————————————
    /**
     * Crée un lot d'affectations (min. 2 agents). La note de service commune est
     * un fichier optionnel : on encode en `FormData` dès qu'un fichier est fourni.
     */
    creerGroupe: (payload: AffectationGroupeeInput, noteService?: File | null) => {
      if (!noteService) {
        return api<ApiResponse<LotAffectation>>("/carriere/affectations/groupee", {
          method: "POST",
          body: payload,
        });
      }

      const form = new FormData();
      form.append("date_affectation", payload.date_affectation);
      if (payload.motif) form.append("motif", payload.motif);
      form.append("note_service", noteService);
      payload.agents.forEach((ligne, i) => {
        form.append(`agents[${i}][agent_id]`, String(ligne.agent_id));
        form.append(`agents[${i}][structurable_type]`, ligne.structurable_type);
        form.append(`agents[${i}][structurable_id]`, String(ligne.structurable_id));
        if (ligne.superieur_hierarchique_id != null) {
          form.append(
            `agents[${i}][superieur_hierarchique_id]`,
            String(ligne.superieur_hierarchique_id),
          );
        }
      });

      return api<ApiResponse<LotAffectation>>("/carriere/affectations/groupee", {
        method: "POST",
        body: form,
      });
    },

    lot: (id: number) =>
      api<ApiResponse<LotAffectation>>(`/carriere/affectations/lots/${id}`),

    activerLot: (id: number) =>
      api<ApiResponse<LotAffectation>>(`/carriere/affectations/lots/${id}/activer`, {
        method: "POST",
      }),

    rejeterLot: (id: number, commentaire?: string) =>
      api<ApiResponse<LotAffectation>>(`/carriere/affectations/lots/${id}/rejeter`, {
        method: "POST",
        body: commentaire ? { commentaire } : {},
      }),

    acteLot: (id: number) =>
      api<Blob>(`/carriere/affectations/lots/${id}/acte`, { responseType: "blob" }),

    /**
     * ZIP des notes de service **individuelles** d'un ensemble d'affectations.
     *
     * À ne pas confondre avec `acteLot`, qui rend l'acte **collectif** du lot :
     * ici on récupère une note par agent, celle qu'on lui remet en main propre.
     * Les identifiants sont libres — ils n'ont pas à appartenir au même lot.
     */
    notesServiceLot: (affectationIds: number[]) =>
      api<Blob>("/carriere/affectations/notes-service/lot", {
        method: "POST",
        body: { affectation_ids: affectationIds },
        responseType: "blob",
      }),
  };
}
