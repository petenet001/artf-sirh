import type { ListParams } from "~/types/api";

/**
 * Charge les demandes de congé selon une **portée** :
 * - `mine` : les demandes de l'agent connecté (`/conges/agents/{id}/demandes`) ;
 * - `all` : toutes les demandes (`/conges/demandes`), pour la RH / les valideurs.
 *
 * L'API ne pagine pas : collection plate, filtres par égalité exacte
 * (`statut`, `type_conge_id`) envoyés au serveur.
 */
export function useDemandesConge() {
  const api = useDemandesCongeApi();
  const auth = useAuthStore();

  const scope = ref<"mine" | "all">(auth.user?.agent_id ? "mine" : "all");
  const filters = reactive<ListParams>({});

  const { data, pending, error, refresh } = useAsyncData(
    "demandes-conge",
    () => {
      const agentId = auth.user?.agent_id;
      if (scope.value === "mine" && agentId) return api.byAgent(agentId, { ...filters });
      return api.list({ ...filters });
    },
    { watch: [scope, filters] },
  );

  const demandes = computed(() => data.value?.data ?? []);

  return { demandes, scope, filters, pending, error, refresh };
}
