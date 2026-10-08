import { campagneDeLAnnee } from "~/constants/conges-annuels";

/**
 * Campagnes de congé annuel (`GET /conges-annuels/campagnes`, `consulter-conges`).
 *
 * Clé partagée : l'écran de gestion, son onglet « Campagnes » et « Mes congés »
 * lisent la même collection — ouvrir ou clôturer depuis l'un rafraîchit
 * les autres.
 *
 * `courante` = la campagne **ouverte** s'il y en a une (elle peut viser l'année
 * suivante), sinon celle de l'année civile.
 */
export function useCampagnesCongeAnnuel(enabled: () => boolean = () => true) {
  const api = useCongesAnnuelsApi();

  const { data, pending, error, refresh } = useAsyncData("conges-annuels-campagnes", () =>
    enabled() ? api.campagnes.list() : Promise.resolve(null),
  );

  const campagnes = computed(() => [...(data.value?.data ?? [])].sort((a, b) => b.annee - a.annee));
  const courante = computed(
    () => campagnes.value.find((c) => c.statut === "ouverte") ?? campagneDeLAnnee(campagnes.value, new Date().getFullYear()),
  );

  return { campagnes, courante, pending, error, refresh };
}
