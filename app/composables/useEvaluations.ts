import type { ListParams } from "~/types/api";

/**
 * Portée de la liste des fiches d'évaluation :
 * - `mine`    : mes fiches en tant qu'agent évalué ;
 * - `a_noter` : les fiches dont je suis le notateur (N+1) ;
 * - `all`     : toutes les fiches (vue RH), filtrables serveur.
 */
export type PorteeEvaluations = "mine" | "a_noter" | "all";

/**
 * Charge les fiches d'évaluation selon une portée. Les deux premières routes
 * déduisent l'agent du token : elles n'acceptent aucun filtre. La vue `all`
 * filtre côté serveur par égalité exacte (`session_id`, `statut`, `agent_id`,
 * `superieur_id`, `inscrit_tableau`).
 */
export function useEvaluations(portee?: PorteeEvaluations) {
  const api = useEvaluationsApi();
  const auth = useAuthStore();

  const scope = ref<PorteeEvaluations>(
    portee ?? (auth.user?.agent_id ? "mine" : "all"),
  );
  const filters = reactive<ListParams>({});

  const { data, pending, error, refresh } = useAsyncData(
    "evaluations",
    () => {
      if (scope.value === "mine") return api.mesEvaluations();
      if (scope.value === "a_noter") return api.aNoter();
      return api.list({ ...filters });
    },
    { watch: [scope, filters] },
  );

  const evaluations = computed(() => data.value?.data ?? []);

  return { evaluations, scope, filters, pending, error, refresh };
}
