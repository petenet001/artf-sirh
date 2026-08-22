import type { ListParams } from "~/types/api";

/**
 * Charge et expose la liste des agents — **hors stagiaires** (les agents dont
 * le type d'intégration est « Stage professionnel » sont gérés à part).
 * L'API ne pagine pas : collection plate, filtres par égalité exacte sur les
 * champs whitelistés (`nom`, `prenom`, `matricule`, `statut`, `genre`).
 */
export function useAgents() {
  const agentsApi = useAgentsApi();
  const { stageTypeId } = useStageType();

  const filters = reactive<ListParams>({});

  const { data, pending, error, refresh } = useAsyncData(
    "agents-list",
    () => agentsApi.list({ ...filters }),
    { watch: [filters] },
  );

  const agents = computed(() => {
    const list = data.value?.data ?? [];
    const stage = stageTypeId.value;
    return stage ? list.filter((a) => a.type_integration_id !== stage) : list;
  });

  return { agents, filters, pending, error, refresh };
}
