import type { ListParams } from "~/types/api";

/** Portée de la liste des absences. */
export type PorteeAbsences = "mine" | "a_valider" | "all";

/**
 * Charge les absences selon une **portée** (comme les congés) :
 * - `mine` : les absences de l'agent connecté (`/absences/agents/{id}`) ;
 * - `a_valider` : la file N+1 (`/absences/a-valider`) — les absences en
 *   attente dont l'utilisateur est le supérieur (`admin` : toutes). C'est la
 *   seule vue qui porte les actions valider / rejeter : l'API renvoie 403 à
 *   quiconque n'est pas le N+1, même avec `valider-absences` ;
 * - `all` : toutes les absences (`/absences`).
 *
 * Collection plate, filtres par égalité exacte (`statut`, `type_absence_id`,
 * `justifiee`).
 */
export function useAbsences() {
  const api = useAbsencesApi();
  const auth = useAuthStore();

  const scope = ref<PorteeAbsences>(
    auth.can("valider-absences") ? "a_valider" : auth.user?.agent_id ? "mine" : "all",
  );
  const filters = reactive<ListParams>({});

  const { data, pending, error, refresh } = useAsyncData(
    "absences",
    () => {
      const agentId = auth.user?.agent_id;
      if (scope.value === "a_valider") return api.aValider();
      if (scope.value === "mine" && agentId) return api.byAgent(agentId, { ...filters });
      return api.list({ ...filters });
    },
    { watch: [scope, filters] },
  );

  const absences = computed(() => data.value?.data ?? []);

  return { absences, scope, filters, pending, error, refresh };
}
