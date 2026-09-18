import type { ListParams } from "~/types/api";

/**
 * Les « stagiaires » ne sont pas une population distincte côté API : ce sont
 * des AGENTS dont le type d'intégration est « Stage professionnel ».
 *
 * L'API expose désormais `GET /personnel/stagiaires`, qui fait le tri côté
 * serveur **et** applique le cloisonnement de structure (vague F). On l'utilise
 * donc directement : le filtrage en mémoire qui compensait son absence est
 * supprimé — il était une entorse assumée à la règle « pas de filtrage
 * mémoire », et il n'a plus lieu d'être.
 *
 * `stageTypeId` reste exposé : les écrans s'en servent encore pour distinguer
 * un stagiaire dans une liste mixte.
 */
export function useStagiaires() {
  const agentsApi = useAgentsApi();
  const { stageTypeId } = useStageType();

  const filters = reactive<ListParams>({});

  const { data, pending, error, refresh } = useAsyncData(
    "stagiaires-agents",
    () => agentsApi.stagiaires({ ...filters }),
    { watch: [filters] },
  );

  const stagiaires = computed(() => data.value?.data ?? []);

  return { stagiaires, filters, pending, error, refresh, stageTypeId };
}
