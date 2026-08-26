/**
 * Synthèse carrière d'un agent — `GET /carriere/agents/{id}`
 * (CarriereAgentController::synthese). Agrège en un appel les situations
 * *actives* : contrat, affectation, nomination et salaire. Endpoint dédié du
 * module carrière (pas d'alias `/integration`). Un id invalide ne déclenche
 * aucune requête.
 */
export function useCarriereSynthese(id: MaybeRefOrGetter<number>) {
  const carriereApi = useCarriereApi();
  const agentId = computed(() => toValue(id));

  const { data, pending, error, refresh } = useAsyncData(
    () => `carriere-synthese-${agentId.value}`,
    () => (agentId.value > 0 ? carriereApi.synthese(agentId.value) : Promise.resolve(null)),
    { watch: [agentId] },
  );

  const synthese = computed(() => data.value?.data ?? null);

  return { synthese, pending, error, refresh };
}
