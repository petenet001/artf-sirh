import type { ListParams } from "~/types/api";

/**
 * Liste des agents du menu Personnel — **hors stagiaires** (gérés à part).
 *
 * S'appuie sur `GET /personnel/agents`, la liste **filtrée par structure**
 * (vague F) : un chef de service y voit les agents de son service, un chef de
 * bureau ceux de son bureau. L'ancienne source, `/integration/agents`, renvoie
 * tous les dossiers sans aucun filtre — et sans permission de route : la
 * brancher ici exposait l'effectif entier à n'importe quel chef.
 *
 * L'API ne pagine pas : collection plate, filtres par égalité exacte sur les
 * champs whitelistés (`nom`, `prenom`, `matricule`, `statut`,
 * `type_integration_id`).
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
