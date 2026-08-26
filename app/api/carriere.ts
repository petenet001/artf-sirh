import type { ApiResponse } from "~/types/api";
import type { CarriereAgent } from "~/schemas/carriere-agent";

/**
 * Repository Carrière — agrégats transverses du module carrière. Aujourd'hui,
 * la seule route propre est la synthèse d'un agent (`GET /carriere/agents/{id}`),
 * sans alias `/integration`. Les actes de carrière (affectations, nominations,
 * contrats, salaires) vivent dans leurs repos dédiés. Les fonctions throwent.
 */
export function useCarriereApi() {
  const api = useApiClient();

  return {
    /** Synthèse carrière : contrat / affectation / nomination / salaire actifs. */
    synthese: (agentId: number) =>
      api<ApiResponse<CarriereAgent>>(`/carriere/agents/${agentId}`),
  };
}
