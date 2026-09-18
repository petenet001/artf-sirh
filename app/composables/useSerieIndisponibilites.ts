import type { SerieCourbe } from "~/components/viz/Courbe.vue";
import { estCongeAccorde } from "~/constants/conges";
import { grilleMois, compterParMois } from "~/utils/series";

/**
 * Évolution mensuelle des indisponibilités : congés accordés d'un côté,
 * absences déclarées de l'autre, sur une même échelle.
 *
 * ## Ce qui est compté, et pourquoi
 *
 * On compte des **événements** (« 14 congés ont démarré en août »), pas des
 * **jours**. Ce n'est pas un repli : c'est la seule mesure que le front peut
 * calculer sans trancher une règle de gestion.
 *
 * - un congé **commence** à une date et une seule : l'affecter au mois de
 *   `date_debut` est exact, quelle que soit sa durée ;
 * - un **nombre de jours** par mois, lui, suppose de décider ce qu'on fait d'un
 *   congé du 28 février au 9 mars : 10 jours en février ? 1 en février et 9 en
 *   mars ? au prorata des jours ouvrés ? C'est une décision métier, pas un
 *   calcul — elle reste dans la demande n° 1 adressée au backend.
 *
 * Les deux séries partagent donc la même unité (des événements) et la même
 * échelle : leur superposition est honnête. Si le backend expose un jour des
 * jours mensualisés, la courbe « jours d'indisponibilité » viendra s'ajouter —
 * pas remplacer celle-ci, qui mesure autre chose.
 *
 * ## Périmètre
 *
 * - **Congés** : seulement les demandes **accordées**. Une demande rejetée n'a
 *   éloigné personne ; la compter gonflerait la courbe d'un non-événement.
 *   Sur une liste, `type_conge` n'est pas chargé : `estCongeAccorde` retombe
 *   alors sur son critère générique (`validee_rh` / `validee_dg`).
 * - **Absences** : tous statuts. Une absence est un fait constaté ; son statut
 *   dit si elle est justifiée, pas si elle a eu lieu.
 *
 * Une série absente (permission manquante) n'est pas tracée à zéro : elle
 * disparaît, et la courbe reste vraie sur ce qu'elle montre.
 */
export function useSerieIndisponibilites(mois = 12) {
  const congesApi = useDemandesCongeApi();
  const absencesApi = useAbsencesApi();
  const auth = useAuthStore();

  const { data: demandesData, pending: pendingConges } = useAsyncData(
    "serie-indisponibilites-conges",
    () => (auth.can("consulter-conges") ? congesApi.list() : Promise.resolve(null)),
  );
  const { data: absencesData, pending: pendingAbsences } = useAsyncData(
    "serie-indisponibilites-absences",
    () => (auth.can("consulter-absences") ? absencesApi.list() : Promise.resolve(null)),
  );

  const series = computed<SerieCourbe[]>(() => {
    const grille = grilleMois(mois);
    const sorties: SerieCourbe[] = [];

    if (demandesData.value) {
      const accordes = demandesData.value.data.filter((d) => estCongeAccorde(d));
      sorties.push({
        cle: "conges",
        libelle: "Congés accordés",
        points: compterParMois(accordes.map((d) => d.date_debut), grille),
      });
    }
    if (absencesData.value) {
      sorties.push({
        cle: "absences",
        libelle: "Absences déclarées",
        points: compterParMois(absencesData.value.data.map((a) => a.date_debut), grille),
      });
    }
    return sorties;
  });

  /** Total sur la fenêtre, par série — le repère chiffré sous le graphique. */
  const totaux = computed(() =>
    series.value.map((s) => ({
      cle: s.cle,
      libelle: s.libelle,
      total: s.points.reduce((somme, p) => somme + p.valeur, 0),
    })),
  );

  const pending = computed(() => pendingConges.value || pendingAbsences.value);

  return { series, totaux, pending };
}
