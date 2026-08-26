import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type {
  Nomination,
  NominationInput,
  NominationUpdate,
  NominationGroupeeInput,
  LotNomination,
  PosteVacant,
  AgentsSousAutorite,
} from "~/schemas/nomination";

/**
 * Repository Nominations (module carrière). Seul endroit autorisé à connaître
 * les routes nominations. Préfixe canonique `/carriere` (alias `/integration`
 * encore acceptés mais non ciblés). Toutes les fonctions throwent.
 *
 * ⚠️ Activer une nomination ne change plus le statut du dossier ;
 * `dossier_integration_id` est accepté mais ignoré. Statuts en minuscules.
 */
export function useNominationsApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<Nomination>>("/carriere/nominations", { query: params }),

    getById: (id: number) =>
      api<ApiResponse<Nomination>>(`/carriere/nominations/${id}`),

    byAgent: (agentId: number) =>
      api<ApiCollection<Nomination>>(`/carriere/agents/${agentId}/nominations`),

    /** Historique : toutes les nominations de l'agent SAUF l'active. */
    historique: (agentId: number) =>
      api<ApiCollection<Nomination>>(`/carriere/agents/${agentId}/nominations/historique`),

    create: (payload: NominationInput) =>
      api<ApiResponse<Nomination>>("/carriere/nominations", {
        method: "POST",
        body: payload,
      }),

    /** Mise à jour — uniquement tant que la nomination est `en_attente`. */
    update: (id: number, payload: NominationUpdate) =>
      api<ApiResponse<Nomination>>(`/carriere/nominations/${id}`, {
        method: "PUT",
        body: payload,
      }),

    activer: (id: number, payload?: { dossier_integration_id?: number }) =>
      api<ApiResponse<Nomination>>(`/carriere/nominations/${id}/activer`, {
        method: "POST",
        body: payload ?? {},
      }),

    cloturer: (id: number) =>
      api<ApiResponse<Nomination>>(`/carriere/nominations/${id}/cloturer`, {
        method: "POST",
      }),

    rejeter: (id: number) =>
      api<ApiResponse<Nomination>>(`/carriere/nominations/${id}/rejeter`, {
        method: "POST",
      }),

    acte: (id: number) =>
      api<Blob>(`/carriere/nominations/${id}/acte`, { responseType: "blob" }),

    // — Lectures métier ————————————————————————————————————————
    /** Structures (Direction / Service / Bureau) sans nomination active. */
    postesVacants: () =>
      api<ApiCollection<PosteVacant>>("/carriere/nominations/postes-vacants"),

    /** Ligne hiérarchique d'un chef (agent). */
    agentsSousAutorite: (chefId: number) =>
      api<ApiResponse<AgentsSousAutorite>>(
        `/carriere/nominations/chefs/${chefId}/agents-sous-autorite`,
      ),

    // — Lot groupé (un circuit, un acte) ——————————————————————————
    creerGroupe: (payload: NominationGroupeeInput) =>
      api<ApiResponse<LotNomination>>("/carriere/nominations/groupee", {
        method: "POST",
        body: payload,
      }),

    lot: (id: number) =>
      api<ApiResponse<LotNomination>>(`/carriere/nominations/lots/${id}`),

    activerLot: (id: number) =>
      api<ApiResponse<LotNomination>>(`/carriere/nominations/lots/${id}/activer`, {
        method: "POST",
      }),

    rejeterLot: (id: number, commentaire?: string) =>
      api<ApiResponse<LotNomination>>(`/carriere/nominations/lots/${id}/rejeter`, {
        method: "POST",
        body: commentaire ? { commentaire } : {},
      }),

    acteLot: (id: number) =>
      api<Blob>(`/carriere/nominations/lots/${id}/acte`, { responseType: "blob" }),
  };
}
