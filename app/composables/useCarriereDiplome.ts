import type { CarriereDeduite } from "~/utils/carriere";

/**
 * Déduit la carrière d'entrée (catégorie, grade, échelon) du diplôme choisi.
 *
 * Passe par `useReferentiels` : les listes déjà chargées par les selects du
 * formulaire sont réutilisées (même clé **et** même handler `useAsyncData`),
 * seule la grille est un appel de plus.
 * Règle et cas de repli : `utils/carriere.ts`.
 */
export function useCarriereDiplome() {
  const { items: diplomes } = useDiplomeOptions();
  const { items: echelons } = useEchelonOptions();
  const { items: classes, pending } = useGrilleClasseOptions();

  /** Carrière déduite, ou `null` si le diplôme n'est rattaché à aucune classe. */
  function deduire(diplomeId: number | null | undefined): CarriereDeduite | null {
    if (diplomeId == null) return null;

    const diplome = diplomes.value.find((d) => d.id === diplomeId) ?? null;

    return carriereDepuisDiplome(diplome, classes.value, echelons.value);
  }

  return { deduire, pending };
}
