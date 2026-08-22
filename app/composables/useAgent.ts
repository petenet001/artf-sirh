/**
 * Charge un agent unique (détail). Le backend charge les relations sur le
 * `show` (grade, catégorie, échelon, fonction, type d'intégration, affectation/
 * nomination/contrat actifs) — cf. AgentController::showRelations.
 */
export function useAgent(id: MaybeRefOrGetter<number>) {
  const agentsApi = useAgentsApi();
  const agentId = computed(() => toValue(id));

  // Garde : un id invalide (0 / NaN, ex. utilisateur sans fiche agent liée)
  // ne déclenche aucune requête — la composable reste réutilisable hors détail.
  const { data, pending, error, refresh } = useAsyncData(
    () => `agent-${agentId.value}`,
    () => (agentId.value > 0 ? agentsApi.getById(agentId.value) : Promise.resolve(null)),
    { watch: [agentId] },
  );

  const agent = computed(() => data.value?.data ?? null);

  return { agent, pending, error, refresh };
}
