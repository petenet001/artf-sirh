/**
 * Référentiels chargés depuis **plusieurs** endroits (un select de formulaire et
 * un composable de calcul, typiquement).
 *
 * Nuxt compare le *handler* des appels `useAsyncData` partageant une clé : deux
 * closures écrites séparément — même identiques au caractère près — sont deux
 * fonctions différentes, d'où l'avertissement « Incompatible options detected ».
 * On expose donc **une seule** fonction de chargement par référentiel, et tous
 * les appelants passent par ces composables plutôt que de redéclarer la clé.
 *
 * Un référentiel consommé à un seul endroit n'a pas besoin d'entrer ici :
 * `useResourceOptions("opt-<x>", …)` suffit.
 */

// Handlers stables (portée module) : c'est leur identité qui compte.
const listDiplomes = () => useDiplomesApi().list();
const listEchelons = () => useEchelonsApi().list();
const listGrilleClasses = () => useGrilleClassesApi().list();

/** Diplômes — select de la fiche agent + déduction de carrière. */
export function useDiplomeOptions() {
  return useResourceOptions("opt-diplomes", listDiplomes);
}

/** Échelons — select de la fiche agent + déduction de carrière. */
export function useEchelonOptions() {
  return useResourceOptions("opt-echelons", listEchelons);
}

/** Classes de la grille salariale — déduction de carrière. */
export function useGrilleClasseOptions() {
  return useResourceOptions("opt-grille-classes", listGrilleClasses);
}
