import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type {
  PositionConventionnelle,
  PositionConventionnelleInput,
  TraitementPositionInput,
  ClosurePositionInput,
  RenouvellementPositionInput,
} from "~/schemas/position-conventionnelle";

/**
 * Repository Positions conventionnelles (`/carriere/positions`, CCN art. 76–80).
 *
 * Circuit : la RH soumet (`gerer-salaires`) → le **DG** approuve ou rejette
 * (403 pour quiconque d'autre) → la RH clôture. Le renouvellement relève aussi
 * du DG (disponibilité : deux fois au plus).
 *
 * Filtres serveur : `agent_id`, `type`, `statut`.
 */
export function usePositionsApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<PositionConventionnelle>>("/carriere/positions", { query: params }),

    byAgent: (agentId: number) =>
      api<ApiCollection<PositionConventionnelle>>(`/carriere/agents/${agentId}/positions`),

    getById: (id: number) =>
      api<ApiResponse<PositionConventionnelle>>(`/carriere/positions/${id}`),

    create: (payload: PositionConventionnelleInput) =>
      api<ApiResponse<PositionConventionnelle>>("/carriere/positions", { method: "POST", body: payload }),

    /** Réservé au DG / admin : active la position et applique les effets CCN. */
    approuver: (id: number, payload?: TraitementPositionInput) =>
      api<ApiResponse<PositionConventionnelle>>(`/carriere/positions/${id}/approuver`, {
        method: "POST",
        body: payload ?? {},
      }),

    rejeter: (id: number, payload?: TraitementPositionInput) =>
      api<ApiResponse<PositionConventionnelle>>(`/carriere/positions/${id}/rejeter`, {
        method: "POST",
        body: payload ?? {},
      }),

    /**
     * Clôture par la RH. Sur un détachement sans affectation active, la réponse
     * porte `reintegration.affectation_manquante` : il faut réaffecter l'agent
     * à un emploi de sa classe (art. 78) — rien n'est créé automatiquement.
     */
    cloturer: (id: number, payload?: ClosurePositionInput) =>
      api<ApiResponse<PositionConventionnelle>>(`/carriere/positions/${id}/cloturer`, {
        method: "POST",
        body: payload ?? {},
      }),

    renouveler: (id: number, payload: RenouvellementPositionInput) =>
      api<ApiResponse<PositionConventionnelle>>(`/carriere/positions/${id}/renouveler`, {
        method: "POST",
        body: payload,
      }),
  };
}
