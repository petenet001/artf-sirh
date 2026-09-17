import type { ListParams } from "~/types/api";

/**
 * Sessions d'évaluation (vue RH). Collection plate, filtres serveur par
 * égalité exacte (`statut`, `type_annee`).
 */
export function useSessionsEvaluation() {
  const api = useSessionsEvaluationApi();
  const filters = reactive<ListParams>({});

  const { data, pending, error, refresh } = useAsyncData(
    "sessions-evaluation",
    () => api.list({ ...filters }),
    { watch: [filters] },
  );

  const sessions = computed(() => data.value?.data ?? []);

  return { sessions, filters, pending, error, refresh };
}
