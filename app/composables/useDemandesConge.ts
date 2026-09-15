import type { ListParams } from "~/types/api";

/** Portée de la liste des demandes de congé. */
export type PorteeConges = "mine" | "a_valider" | "all";

/**
 * Charge les demandes de congé selon une **portée** :
 * - `mine` : les demandes de l'agent connecté (`/conges/agents/{id}/demandes`) ;
 * - `a_valider` : la file du signataire (`/conges/demandes/a-valider`) — seules
 *   les demandes dont l'étape courante lui revient (N+1 réel / RH / DG) ;
 * - `all` : toutes les demandes (`/conges/demandes`), pour la RH.
 *
 * Portée par défaut : la file si l'on peut valider, sinon ses propres demandes.
 * L'API ne pagine pas : collection plate, filtres par égalité exacte
 * (`statut`, `type_conge_id`) envoyés au serveur (sauf sur la file, non filtrable).
 */
export function useDemandesConge() {
  const api = useDemandesCongeApi();
  const auth = useAuthStore();

  const scope = ref<PorteeConges>(
    auth.can("valider-conges") ? "a_valider" : auth.user?.agent_id ? "mine" : "all",
  );
  const filters = reactive<ListParams>({});

  const { data, pending, error, refresh } = useAsyncData(
    "demandes-conge",
    () => {
      const agentId = auth.user?.agent_id;
      if (scope.value === "a_valider") return api.aValider();
      if (scope.value === "mine" && agentId) return api.byAgent(agentId, { ...filters });
      return api.list({ ...filters });
    },
    { watch: [scope, filters] },
  );

  const demandes = computed(() => data.value?.data ?? []);

  return { demandes, scope, filters, pending, error, refresh };
}
