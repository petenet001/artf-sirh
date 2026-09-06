import type { CarriereDeduite } from "~/utils/carriere";

/**
 * Déduit la carrière d'entrée (catégorie, grade, échelon) du diplôme choisi.
 *
 * Les clés `useAsyncData` sont celles de `useResourceOptions` (`opt-diplomes`,
 * `opt-echelons`) : les listes déjà chargées par les selects du formulaire sont
 * réutilisées, seule la grille (`opt-grille-classes`) est un appel de plus.
 * Règle et cas de repli : `utils/carriere.ts`.
 */
export function useCarriereDiplome() {
  const { data: diplomes } = useAsyncData("opt-diplomes", () => useDiplomesApi().list());
  const { data: echelons } = useAsyncData("opt-echelons", () => useEchelonsApi().list());
  const { data: classes, pending } = useAsyncData("opt-grille-classes", () =>
    useGrilleClassesApi().list(),
  );

  /** Carrière déduite, ou `null` si le diplôme n'est rattaché à aucune classe. */
  function deduire(diplomeId: number | null | undefined): CarriereDeduite | null {
    if (diplomeId == null) return null;

    const diplome = diplomes.value?.data.find((d) => d.id === diplomeId) ?? null;

    return carriereDepuisDiplome(diplome, classes.value?.data ?? [], echelons.value?.data ?? []);
  }

  return { deduire, pending };
}
