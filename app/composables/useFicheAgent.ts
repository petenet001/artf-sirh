/**
 * Charge la **fiche personnel** complète d'un agent
 * (`GET /personnel/agents/{id}`) : identité, carrière ET vie courante (infos,
 * contacts, situation, documents) en une seule réponse. Superset de la fiche
 * wizard (`/integration/agents/{id}`) — on privilégie donc cet endpoint sur la
 * page fiche pour tout afficher sans multiplier les requêtes.
 *
 * `refresh` est rappelé après chaque écriture (upsert, contact, document,
 * archivage) pour resynchroniser les sections.
 */
export function useFicheAgent(id: MaybeRefOrGetter<number>) {
  const api = usePersonnelAgentsApi();
  const agentId = computed(() => toValue(id));

  const { data, pending, error, refresh } = useAsyncData(
    () => `fiche-agent-${agentId.value}`,
    () => (agentId.value > 0 ? api.fiche(agentId.value) : Promise.resolve(null)),
    { watch: [agentId] },
  );

  const agent = computed(() => data.value?.data ?? null);

  return { agent, pending, error, refresh };
}
