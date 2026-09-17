import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { PaieElement, PaieElementInput } from "~/schemas/paie-element";
import type { PaieAffectation, PaieAffectationInput } from "~/schemas/paie-affectation";
import type { PaieLot, PaieLotInput, PaieLotLigne } from "~/schemas/paie-lot";

/**
 * Repository Paie (`/api/paie`, CCN art. 54–59). Trois objets : le référentiel
 * des éléments, leur affectation aux agents, et le lot mensuel qui calcule.
 *
 * Permissions **existantes** : `consulter-salaires` en lecture,
 * `gerer-salaires` en écriture — il n'y a pas de permission `gerer-paie`.
 *
 * Deux principes de consommation :
 * 1. les boutons du lot suivent `data.actions.*`, pas une déduction locale ;
 * 2. les éléments **automatiques** (ancienneté, 13ᵉ mois, rentrée, arbre de
 *    Noël) ne s'affectent pas : le lot les calcule (422 sinon).
 */
export function usePaieApi() {
  const api = useApiClient();

  return {
    // — Éléments (filtres : nature, actif, code, systeme, periodicite, mode_calcul) —
    elements: (params?: ListParams) =>
      api<ApiCollection<PaieElement>>("/paie/elements", { query: params }),

    element: (id: number) => api<ApiResponse<PaieElement>>(`/paie/elements/${id}`),

    /** Élément **maison** uniquement : un code CCN est refusé (422). */
    creerElement: (payload: PaieElementInput) =>
      api<ApiResponse<PaieElement>>("/paie/elements", { method: "POST", body: payload }),

    /** Sur un élément CCN : seuls libellé, montants, `actif` et sigles sont modifiables. */
    modifierElement: (id: number, payload: Partial<PaieElementInput>) =>
      api<ApiResponse<PaieElement>>(`/paie/elements/${id}`, { method: "PUT", body: payload }),

    supprimerElement: (id: number) =>
      api<{ message: string }>(`/paie/elements/${id}`, { method: "DELETE" }),

    // — Affectations (filtres : agent_id, element_id, actives) ——————
    affectations: (params?: ListParams) =>
      api<ApiCollection<PaieAffectation>>("/paie/affectations", { query: params }),

    affectationsAgent: (agentId: number) =>
      api<ApiCollection<PaieAffectation>>(`/paie/agents/${agentId}/affectations`),

    affectation: (id: number) => api<ApiResponse<PaieAffectation>>(`/paie/affectations/${id}`),

    affecter: (payload: PaieAffectationInput) =>
      api<ApiResponse<PaieAffectation>>("/paie/affectations", { method: "POST", body: payload }),

    modifierAffectation: (id: number, payload: Partial<PaieAffectationInput>) =>
      api<ApiResponse<PaieAffectation>>(`/paie/affectations/${id}`, { method: "PUT", body: payload }),

    supprimerAffectation: (id: number) =>
      api<{ message: string }>(`/paie/affectations/${id}`, { method: "DELETE" }),

    // — Lots mensuels (filtres : annee, mois, statut) ————————————————
    lots: (params?: ListParams) => api<ApiCollection<PaieLot>>("/paie/lots", { query: params }),

    lot: (id: number) => api<ApiResponse<PaieLot>>(`/paie/lots/${id}`),

    /** 422 si un lot existe déjà pour la période. */
    creerLot: (payload: PaieLotInput) =>
      api<ApiResponse<PaieLot>>("/paie/lots", { method: "POST", body: payload }),

    /** Seul le commentaire est modifiable, et pas après validation. */
    modifierLot: (id: number, payload: { commentaire?: string | null }) =>
      api<ApiResponse<PaieLot>>(`/paie/lots/${id}`, { method: "PUT", body: payload }),

    supprimerLot: (id: number) => api<{ message: string }>(`/paie/lots/${id}`, { method: "DELETE" }),

    /** Génère ou **recalcule** le lot (refusé une fois validé). */
    genererLot: (id: number) =>
      api<ApiResponse<PaieLot>>(`/paie/lots/${id}/generer`, { method: "POST", body: {} }),

    controlerLot: (id: number) =>
      api<ApiResponse<PaieLot>>(`/paie/lots/${id}/controler`, { method: "POST", body: {} }),

    /** 422 tant qu'il reste une anomalie bloquante. */
    validerLot: (id: number) =>
      api<ApiResponse<PaieLot>>(`/paie/lots/${id}/valider`, { method: "POST", body: {} }),

    cloturerLot: (id: number) =>
      api<ApiResponse<PaieLot>>(`/paie/lots/${id}/cloturer`, { method: "POST", body: {} }),

    // — Lignes et bulletins ——————————————————————————————————————————
    /** Filtres : `agent_id`, `hors_grille`, `q` (nom / prénom / matricule). */
    lignes: (id: number, params?: ListParams) =>
      api<ApiCollection<PaieLotLigne>>(`/paie/lots/${id}/lignes`, { query: params }),

    ligne: (id: number, ligneId: number) =>
      api<ApiResponse<PaieLotLigne>>(`/paie/lots/${id}/lignes/${ligneId}`),

    /** Bulletin enrichi du mois (gains / retenues / net) — dès la génération. */
    bulletinLigne: (id: number, ligneId: number) =>
      api<Blob>(`/paie/lots/${id}/lignes/${ligneId}/bulletin`, { responseType: "blob" }),

    /** Historique des bulletins d'un agent, tous lots confondus. */
    bulletinsAgent: (agentId: number) =>
      api<ApiCollection<PaieLotLigne>>(`/paie/agents/${agentId}/bulletins`),

    /** Masse salariale du mois. 422 tant que le lot n'est pas validé. */
    exporterLot: (id: number, format: "csv" | "pdf") =>
      api<Blob>(`/paie/lots/${id}/export`, { query: { format }, responseType: "blob" }),
  };
}
