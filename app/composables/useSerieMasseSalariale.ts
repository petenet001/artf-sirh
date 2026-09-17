import type { PointSerie } from "~/components/viz/Courbe.vue";

/**
 * Évolution mensuelle de la masse salariale, reconstruite depuis les lots de
 * paie (`GET /paie/lots`).
 *
 * C'est la **seule série temporelle exacte** que le front peut composer
 * aujourd'hui : un lot porte son année, son mois et ses totaux, sans ambiguïté
 * d'affectation. Les autres séries attendent le backend — la courbe des jours de
 * congé, par exemple, supposerait de trancher comment répartir un congé à cheval
 * sur deux mois, ce qui est une décision métier, pas un calcul.
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

  const MOIS_COURTS = [
    "janv.", "févr.", "mars", "avr.", "mai", "juin",
    "juil.", "août", "sept.", "oct.", "nov.", "déc.",
  ];

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
        libelle: MOIS_COURTS[lot.mois - 1] ?? String(lot.mois),
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
