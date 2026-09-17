import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { Reclassement, ReclassementInput, TraitementReclassementInput } from "~/schemas/reclassement";

/** Réponse de `appliquer` : idempotente, `meta.applique` dit si ça a bougé. */
export interface ReponseApplicationReclassement extends ApiResponse<Reclassement> {
  meta?: { applique?: boolean };
}

/**
 * Repository Reclassements (CCN art. 73–75, préfixe `/carriere/reclassements`).
 *
 * Permissions : lecture `consulter-salaires` (RH, admin **et DG**), création et
 * application `gerer-salaires` (RH). L'approbation dépend de l'article — RH pour
 * le 73, DG pour les 74 et 75 — et le backend renvoie 403 si l'acteur ne
 * correspond pas (cf. `peutApprouver` dans `constants/reclassements.ts`).
 *
 * Filtres serveur (égalité exacte) : `agent_id`, `type`, `statut`.
 */
export function useReclassementsApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<Reclassement>>("/carriere/reclassements", { query: params }),

    /** Historique d'un agent, pour sa fiche. */
    byAgent: (agentId: number) =>
      api<ApiCollection<Reclassement>>(`/carriere/agents/${agentId}/reclassements`),

    /** Le `show` est le seul à porter le verdict d'`eligibilite`. */
    getById: (id: number) => api<ApiResponse<Reclassement>>(`/carriere/reclassements/${id}`),

    create: (payload: ReclassementInput) =>
      api<ApiResponse<Reclassement>>("/carriere/reclassements", { method: "POST", body: payload }),

    approuver: (id: number, payload?: TraitementReclassementInput) =>
      api<ApiResponse<Reclassement>>(`/carriere/reclassements/${id}/approuver`, {
        method: "POST",
        body: payload ?? {},
      }),

    rejeter: (id: number, payload?: TraitementReclassementInput) =>
      api<ApiResponse<Reclassement>>(`/carriere/reclassements/${id}/rejeter`, {
        method: "POST",
        body: payload ?? {},
      }),

    /** Applique le changement de classe en paie (idempotent). */
    appliquer: (id: number) =>
      api<ReponseApplicationReclassement>(`/carriere/reclassements/${id}/appliquer`, {
        method: "POST",
        body: {},
      }),
  };
}
