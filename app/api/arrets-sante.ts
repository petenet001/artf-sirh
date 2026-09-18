import type { ArretSante, ArretSanteInput } from "~/schemas/arret-sante";

/**
 * Repository Arrêts de santé (`/affaires-sociales/arrets`, D.3.5).
 *
 * Maladie, accident du travail, maladie professionnelle, accident non
 * professionnel (art. 132–135). L'indemnisation se compte en mois de
 * traitement, plein puis demi : c'est le serveur qui fixe les durées selon
 * l'ancienneté et la nature, la simulation les restitue avant décision.
 *
 * Filtres serveur : `agent_id`, `nature`, `statut`.
 */
export function useArretsSanteApi() {
  return dossierSocialApi<ArretSante, ArretSanteInput>("arrets");
}
