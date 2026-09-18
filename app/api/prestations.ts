import type { ApiResponse } from "~/types/api";
import type { Prestation, PrestationInput, SimulationPrestation } from "~/schemas/prestation";

/**
 * Repository Prestations sociales (`/affaires-sociales/prestations`, D.3.4).
 *
 * Règles portées par l'API, qu'on ne redouble pas ici :
 * - `capital_deces` et `indemnite_retraite` sont refusés (422) si un contrat
 *   est encore en période d'essai (art. 119 / 121) ;
 * - les frais funéraires sont plafonnés à 2 000 000 F, transport du corps
 *   compris ;
 * - l'accord pose automatiquement une affectation de paie ponctuelle — le
 *   front n'a rien à écrire dans les salaires.
 *
 * Filtres serveur : `agent_id`, `type`, `statut`.
 */
export function usePrestationsApi() {
  const socle = dossierSocialApi<Prestation, PrestationInput>("prestations");

  return {
    ...socle,
    /** Barème CCN chiffré, typé (le socle renvoie `unknown`). */
    simulation: (id: number) =>
      socle.simulation(id) as Promise<ApiResponse<SimulationPrestation>>,
  };
}
