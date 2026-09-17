import type { ListParams } from "~/types/api";

/**
 * Portée de la liste des dossiers disciplinaires :
 * - `a_instruire` : file RH (rapports déposés) ;
 * - `a_prononcer` : file DG (dossiers instruits) ;
 * - `mes_rapports` : rapports déposés par le connecté (vue des chefs, qui n'ont
 *   pas `consulter-discipline`) ;
 * - `all` : tous les dossiers (RH / DG / admin), filtrable serveur.
 */
export type PorteeSanctions = "a_instruire" | "a_prononcer" | "mes_rapports" | "all";

/**
 * Charge les dossiers disciplinaires selon une portée. La portée par défaut est
 * celle qui correspond au métier du connecté : sa file s'il en a une, sinon ses
 * propres rapports.
 */
export function useSanctions() {
  const api = useSanctionsApi();
  const acteur = useActeurDiscipline();

  const defaut = (): PorteeSanctions => {
    if (acteur.value.peutGerer) return "a_instruire";
    if (acteur.value.peutPrononcer) return "a_prononcer";
    if (acteur.value.peutConsulter) return "all";
    return "mes_rapports";
  };

  const scope = ref<PorteeSanctions>(defaut());
  const filters = reactive<ListParams>({});

  const { data, pending, error, refresh } = useAsyncData(
    "sanctions",
    () => {
      if (scope.value === "a_instruire") return api.aInstruire();
      if (scope.value === "a_prononcer") return api.aPrononcer();
      if (scope.value === "mes_rapports") return api.mesRapports();
      return api.list({ ...filters });
    },
    { watch: [scope, filters] },
  );

  const sanctions = computed(() => data.value?.data ?? []);

  return { sanctions, scope, filters, pending, error, refresh };
}
