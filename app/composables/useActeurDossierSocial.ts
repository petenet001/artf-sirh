import type { ActeurDossierSocial } from "~/constants/dossiers-sociaux";

/**
 * Droits du connecté sur les dossiers sociaux instruits (prestations, prises en
 * charge, arrêts de santé).
 *
 * La CCN sépare l'instruction de la décision, et le backend aussi : la RH monte
 * et instruit le dossier (`gerer-affaires-sociales`), le DG accorde ou refuse
 * (`decider-prestations`). Deux drapeaux, donc, et pas un « peut tout » — un
 * gestionnaire qui verrait le bouton « Accorder » récolterait un 403.
 */
export function useActeurDossierSocial() {
  const auth = useAuthStore();

  return computed<ActeurDossierSocial>(() => ({
    peutGerer: auth.can("gerer-affaires-sociales"),
    peutDecider: auth.can("decider-prestations"),
  }));
}
