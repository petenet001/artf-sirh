import type { PointSerie } from "~/components/viz/Courbe.vue";
import { libelleMois } from "~/utils/series";

/**
 * Évolution mensuelle de la masse salariale, reconstruite depuis les lots de
 * paie (`GET /paie/lots`).
 *
 * Série temporelle **exacte** : un lot porte son année, son mois et ses totaux,
 * sans ambiguïté d'affectation. Pour les congés et absences, c'est le même
 * principe mais en comptant des événements — cf. `useSerieIndisponibilites`,
 * qui explique pourquoi une courbe en *jours* attend encore le backend.
 *
 * Seuls les lots **validés ou clôturés** comptent : un lot en brouillon ou en
 * cours de contrôle donnerait un montant qui bougera encore.
 */
export function useSerieMasseSalariale(mois = 12) {
  const api = usePaieApi();
  const auth = useAuthStore();

  const { data, pending } = useAsyncData("serie-masse-salariale", () =>
    auth.can("consulter-salaires") ? api.lots() : Promise.resolve(null),
  );

  const points = computed<PointSerie[]>(() => {
    const lots = (data.value?.data ?? [])
      .filter((lot) => lot.statut === "valide" || lot.statut === "cloture")
      .filter((lot) => typeof lot.total_net === "number");

    return lots
      // L'API trie du plus récent au plus ancien : une courbe se lit à l'endroit.
      .sort((a, b) => a.annee - b.annee || a.mois - b.mois)
      .slice(-mois)
      .map((lot) => ({
        cle: `${lot.annee}-${String(lot.mois).padStart(2, "0")}`,
        libelle: libelleMois(lot.mois),
        valeur: lot.total_net ?? 0,
      }));
  });

  /** Variation du dernier mois par rapport au précédent, en pourcentage. */
  const variation = computed(() => {
    const serie = points.value;
    if (serie.length < 2) return null;
    const avant = serie[serie.length - 2]!.valeur;
    const apres = serie[serie.length - 1]!.valeur;
    if (!avant) return null;
    return Math.round(((apres - avant) / avant) * 1000) / 10;
  });

  return { points, variation, pending };
}
