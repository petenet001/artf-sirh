import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { Contrat, ContratInput } from "~/schemas/contrat";
import type { AlerteDelaiContrat, RuptureEssaiInput } from "~/schemas/essai";

/**
 * Repository Contrats (module carrière). Seul endroit autorisé à connaître les
 * routes contrats. Préfixe canonique `/carriere` (alias `/integration` encore
 * acceptés mais non ciblés). Pas d'update/remove. Les fonctions throwent.
 *
 * Période d'essai (CCN art. 49) : à la création d'un CDI/CDD, l'API pose
 * l'essai et paie l'**échelon 1** de la classe ; la confirmation rétablit
 * l'échelon prévu. La rupture pendant l'essai se fait sans préavis ni
 * indemnité. `data.essai.prochaine_etape` pilote les boutons.
 */
export function useContratsApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<Contrat>>("/carriere/contrats", { query: params }),

    getById: (id: number) =>
      api<ApiResponse<Contrat>>(`/carriere/contrats/${id}`),

    byAgent: (agentId: number) =>
      api<ApiCollection<Contrat>>(`/carriere/agents/${agentId}/contrats`),

    create: (payload: ContratInput) =>
      api<ApiResponse<Contrat>>("/carriere/contrats", {
        method: "POST",
        body: payload,
      }),

    resilier: (id: number) =>
      api<ApiResponse<Contrat>>(`/carriere/contrats/${id}/resilier`, {
        method: "POST",
      }),

    // — Période d'essai (art. 49) ————————————————————————————————
    /** Une seule fois, et seulement tant que l'essai est `en_cours`. */
    renouvelerEssai: (id: number) =>
      api<ApiResponse<Contrat>>(`/carriere/contrats/${id}/renouveler-essai`, { method: "POST", body: {} }),

    /** Essai concluant : le salaire passe à l'échelon prévu. */
    confirmerEssai: (id: number) =>
      api<ApiResponse<Contrat>>(`/carriere/contrats/${id}/confirmer-essai`, { method: "POST", body: {} }),

    rompreEssai: (id: number, payload?: RuptureEssaiInput) =>
      api<ApiResponse<Contrat>>(`/carriere/contrats/${id}/rompre-essai`, {
        method: "POST",
        body: payload ?? {},
      }),

    /**
     * Agents ayant pris leur service depuis plus de 30 jours ouvrables sans
     * contrat CDI/CDD (art. 52).
     */
    alertesDelai: () =>
      api<ApiCollection<AlerteDelaiContrat>>("/carriere/contrats/alertes/delai-30-jours"),
  };
}
