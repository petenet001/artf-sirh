import type { ListParams } from "~/types/api";

/**
 * Charge les absences selon une **portée** (comme les congés) :
 * - `mine` : les absences de l'agent connecté (`/absences/agents/{id}`) ;
 * - `all` : toutes les absences (`/absences`).
 *
 * Collection plate, filtres par égalité exacte (`statut`, `type_absence_id`,
 * `justifiee`).
 */
export function useAbsences() {
  const api = useAbsencesApi();
  const auth = useAuthStore();

  const scope = ref<"mine" | "all">(auth.user?.agent_id ? "mine" : "all");
  const filters = reactive<ListParams>({});

  const { data, pending, error, refresh } = useAsyncData(
    "absences",
    () => {
      const agentId = auth.user?.agent_id;
      if (scope.value === "mine" && agentId) return api.byAgent(agentId, { ...filters });
      return api.list({ ...filters });
    },
    { watch: [scope, filters] },
  );

  const absences = computed(() => data.value?.data ?? []);

  return { absences, scope, filters, pending, error, refresh };
}
