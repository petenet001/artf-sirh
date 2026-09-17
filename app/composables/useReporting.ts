import type { FiltresReporting } from "~/api/reporting";

/**
 * Charge la vue d'ensemble RH en un bloc : dashboard, congés, évaluations,
 * alertes. Les quatre appels partent en parallèle et `allSettled` garde l'écran
 * debout si l'un échoue — une année sans lot de paie ou sans campagne ne doit
 * pas vider la page.
 *
 * Les filtres (direction, service, bureau, année) valent pour les trois premiers
 * appels ; les alertes sont globales par construction côté API.
 */
export function useReporting() {
  const api = useReportingApi();

  const filtres = reactive<FiltresReporting>({});

  const { data, pending, error, refresh } = useAsyncData(
    "reporting-vue-ensemble",
    async () => {
      const [dashboard, conges, evaluations, alertes] = await Promise.allSettled([
        api.dashboard({ ...filtres }),
        api.statsConges({ ...filtres }),
        api.statsEvaluations({ ...filtres }),
        api.alertes(),
      ]);

      const valeur = <T>(r: PromiseSettledResult<{ data: T }>): T | null =>
        r.status === "fulfilled" ? r.value.data : null;

      return {
        dashboard: valeur(dashboard),
        conges: valeur(conges),
        evaluations: valeur(evaluations),
        alertes: alertes.status === "fulfilled" ? alertes.value.data : [],
      };
    },
    { watch: [filtres] },
  );

  return {
    dashboard: computed(() => data.value?.dashboard ?? null),
    conges: computed(() => data.value?.conges ?? null),
    evaluations: computed(() => data.value?.evaluations ?? null),
    alertes: computed(() => data.value?.alertes ?? []),
    filtres,
    pending,
    error,
    refresh,
  };
}
