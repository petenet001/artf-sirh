import type { Evaluation } from "~/schemas/evaluation";

/**
 * Fiche d'évaluation complète (`show`) : c'est la seule route qui charge
 * **toutes** les relations (notes + critères, session, réclamation, avis
 * hiérarchiques, connaissances).
 *
 * ## Pourquoi trois façons de mettre à jour, et pas une
 *
 * La notation se fait critère par critère, à la sortie de chaque champ. Un
 * `refresh()` complet à chaque note vidait l'écran (le `pending` global
 * repasse à `true`, `BaseDataState` remplace tout par « Chargement… »), puis
 * reconstruisait la grille : à 24 critères, la saisie était hachée.
 *
 * - `appliquer(fiche)` — l'action a renvoyé la fiche recalculée : on la recolle
 *   sans rien demander au réseau. C'est le cas de `noter`, qui renvoie notes,
 *   note globale, mention et statut. Fusion et non remplacement, car la réponse
 *   ne porte pas les relations que l'action n'a pas touchées (`utils/fusion`) ;
 * - `rafraichirEnFond()` — après une action dont on ne connaît pas tous les
 *   effets (modales, avis, réclamation) : on refetch, mais l'écran reste en
 *   place et seul un témoin discret bouge ;
 * - `refresh()` — inchangé, pour un rechargement explicite.
 *
 * `chargementInitial` isole la **première** ouverture : c'est le seul moment où
 * il n'y a rien à montrer, donc le seul où un écran de chargement est légitime.
 */
export function useEvaluation(id: Ref<number>) {
  const api = useEvaluationsApi();

  const { data, pending, error, refresh } = useAsyncData(
    () => `evaluation-${id.value}`,
    () => (id.value > 0 ? api.getById(id.value) : Promise.resolve(null)),
    { watch: [id] },
  );

  const evaluation = computed(() => data.value?.data ?? null);
  const chargementInitial = computed(() => pending.value && !evaluation.value);

  const rafraichissement = ref(false);

  async function rafraichirEnFond() {
    rafraichissement.value = true;
    try {
      await refresh();
    } finally {
      rafraichissement.value = false;
    }
  }

  function appliquer(fiche: Evaluation | null | undefined) {
    if (!data.value?.data || !fiche) return;
    data.value = { ...data.value, data: fusionnerRessource(data.value.data, fiche) };
  }

  return {
    evaluation,
    pending,
    chargementInitial,
    rafraichissement,
    error,
    refresh,
    rafraichirEnFond,
    appliquer,
  };
}
