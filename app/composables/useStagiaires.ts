import type { ListParams } from "~/types/api";

/**
 * Les « stagiaires » ne sont pas une population distincte côté API : ce sont
 * des AGENTS dont le type d'intégration est « Stage professionnel ». Cette vue
 * dérive donc la liste des agents.
 *
 * Le filtrage par type n'étant pas exposé côté serveur (`filterable` agents =
 * nom/prenom/matricule/statut/genre), on résout l'id du type « Stage » puis on
 * filtre la collection — entorse assumée à la règle « pas de filtrage mémoire »
 * pour une simple vue dérivée. `matricule` reste filtré côté serveur.
 */
export function useStagiaires() {
  const agentsApi = useAgentsApi();
  const { stageTypeId } = useStageType();

  const filters = reactive<ListParams>({});

  const { data, pending, error, refresh } = useAsyncData(
    "stagiaires-agents",
    () => agentsApi.list({ ...filters }),
    { watch: [filters] },
  );

  const stagiaires = computed(() => {
    const id = stageTypeId.value;
    const list = data.value?.data ?? [];
    return id ? list.filter((a) => a.type_integration_id === id) : [];
  });

  return { stagiaires, filters, pending, error, refresh, stageTypeId };
}
