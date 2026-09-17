/**
 * Fiche d'évaluation complète (`show`) : c'est la seule route qui charge les
 * relations (notes + critères, session, réclamation, avis hiérarchiques). Les
 * actions du repository ne les rechargent pas toutes → appeler `refresh()`
 * après chaque action plutôt que de recoller la réponse dans l'état.
 */
export function useEvaluation(id: Ref<number>) {
  const api = useEvaluationsApi();

  const { data, pending, error, refresh } = useAsyncData(
    () => `evaluation-${id.value}`,
    () => (id.value > 0 ? api.getById(id.value) : Promise.resolve(null)),
    { watch: [id] },
  );

  const evaluation = computed(() => data.value?.data ?? null);

  return { evaluation, pending, error, refresh };
}
