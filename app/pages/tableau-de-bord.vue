<script setup lang="ts">
import type { AxeRepartitionAffiche } from "~/constants/reporting";
import {
  alertesAffichees,
  AXES_REPARTITION,
  AXE_EXPLICATION,
  AXE_TITRE,
  DEFINITION_EFFECTIF_PRESENT,
  formatCompact,
  formatFCFA,
} from "~/constants/reporting";
import { STATUT_DEMANDE_LABEL, type StatutDemandeConge } from "~/constants/conges";

/**
 * Vue d'ensemble RH, servie par le module Reporting de l'API (`/reporting`).
 *
 * Parti pris : la page doit se comprendre sans connaître le modèle de données.
 * Chaque bloc porte une phrase qui dit **ce qu'il compte**, et chaque graphique
 * écrit ses valeurs — on ne demande jamais de lire une longueur.
 *
 * Ce module n'expose aucune série temporelle (hors périmètre V1 côté backend) :
 * pas de courbe ici tant que l'historisation mensuelle n'existe pas. Un
 * comparatif faux vaudrait moins que son absence.
 */
const auth = useAuthStore();
const toast = useToast();
const handleError = useApiError();
const api = useReportingApi();

const { dashboard, conges, evaluations, alertes, filtres, pending, error } = useReporting();
const { enAttente: filesEnAttente, total: totalFiles, pending: filesPending } = useFilesAttente();
const { points: serieMasse, variation: variationMasse } = useSerieMasseSalariale();
const { series: seriesIndispo, totaux: totauxIndispo } = useSerieIndisponibilites();

/** On n'affiche la courbe que si au moins un événement est tombé dans la fenêtre. */
const indisponibilitesTracables = computed(() => totauxIndispo.value.some((t) => t.total > 0));

const peutReporting = computed(() => auth.can("consulter-reporting"));

// Filtre d'année : l'API raisonne en année civile, il faut donc pouvoir en changer.
const anneeCourante = new Date().getFullYear();
const anneesOptions = Array.from({ length: 5 }, (_, i) => {
  const annee = anneeCourante - i;
  return { label: String(annee), value: annee };
});
const annee = ref<number>(anneeCourante);
watch(annee, (v) => (filtres.annee = v), { immediate: true });

const alertesVisibles = computed(() => alertesAffichees(alertes.value));
const totalAlertes = computed(() => alertesVisibles.value.reduce((s, a) => s + a.total, 0));

/** Répartitions du dashboard, dans l'ordre d'affichage voulu. */
const repartitions = computed(() =>
  AXES_REPARTITION.map((axe) => ({
    axe,
    titre: AXE_TITRE[axe],
    explication: AXE_EXPLICATION[axe as AxeRepartitionAffiche],
    items: dashboard.value?.repartitions?.[axe] ?? [],
  })).filter((r) => r.items.some((i) => i.total > 0)),
);

/** Un axe à la fois, pour composer la grille du bas sans la rendre monotone. */
function axe(cle: AxeRepartitionAffiche) {
  return repartitions.value.find((r) => r.axe === cle) ?? null;
}

const repartitionGenre = computed(() => axe("genre"));
const repartitionAge = computed(() => axe("age"));
const repartitionDirection = computed(() => axe("direction"));
/** Les axes secondaires : même forme, en colonnes compactes. */
const repartitionsSecondaires = computed(() =>
  (["grade", "fonction", "type_integration"] as const).map(axe).filter((r) => r !== null),
);

/** Demandes de congé par statut, en barres lisibles. */
const congesParStatut = computed(() =>
  Object.entries(conges.value?.demandes.par_statut ?? {}).map(([cle, total]) => ({
    cle,
    libelle: STATUT_DEMANDE_LABEL[cle as StatutDemandeConge] ?? cle,
    total,
  })),
);

/**
 * Composition de l'effectif présent : les trois statuts qui le composent, en
 * parts du tout. Le détail d'un chiffre porteur se lit mieux sous lui qu'en
 * trois tuiles séparées.
 */
const compositionEffectif = computed(() => {
  const e = dashboard.value?.effectif;
  if (!e) return [];
  return [
    { cle: "actif", libelle: "Actifs", total: e.actifs },
    { cle: "stagiaire", libelle: "Stagiaires", total: e.stagiaires },
    { cle: "suspendu", libelle: "Suspendus", total: e.suspendus },
  ].filter((i) => i.total > 0);
});

/** Part des jours demandés qui ont été accordés — un ratio parle mieux que deux totaux. */
const tauxAccordConges = computed(() => {
  const d = conges.value?.demandes;
  if (!d?.jours_poses) return null;
  return { accordes: d.jours_accordes, poses: d.jours_poses };
});

/** Mentions dans l'ordre du barème CCN, du meilleur au moins bon. */
const ORDRE_MENTIONS = ["Excellent", "Très bien", "Bien", "Moyen", "Insuffisant"];

const campagne = computed(() => evaluations.value?.session_courante ?? null);
const fichesCampagne = computed(() => campagne.value?.fiches ?? null);
const fichesFinalisees = computed(() => fichesCampagne.value?.par_statut?.finalisee ?? 0);
const mentionsOrdonnees = computed(() => {
  const mentions = fichesCampagne.value?.mentions ?? [];
  return [...mentions].sort(
    (a, b) => ORDRE_MENTIONS.indexOf(a.libelle) - ORDRE_MENTIONS.indexOf(b.libelle),
  );
});

const exportEnCours = ref(false);
async function exporter(type: "effectifs" | "conges" | "evaluations", format: "csv" | "pdf") {
  exportEnCours.value = true;
  try {
    const blob = await api.export(type, format, { annee: annee.value });
    downloadBlob(blob, `${type}-${annee.value}.${format}`);
    toast.add({ title: "Export téléchargé", color: "success" });
  } catch (err) {
    handleError(err);
  } finally {
    exportEnCours.value = false;
  }
}
</script>

<template>
  <BasePanel
    title="Vue d'ensemble RH"
    subtitle="L'état des effectifs, des congés et des campagnes, au jour d'aujourd'hui."
  >
    <template #actions>
      <USelect v-model="annee" :items="anneesOptions" value-key="value" class="w-32" />
    </template>

    <UAlert
      v-if="!peutReporting"
      color="warning"
      variant="subtle"
      icon="i-lucide-lock"
      title="Vue d'ensemble réservée"
      description="Cette page est ouverte aux comptes RH, administrateurs et à la Direction générale."
    />

    <BaseDataState v-else :pending="pending" :error="error">
      <div class="space-y-10">
        <!-- ── 1. Le pouls : un chiffre porteur, puis ce qui l'entoure ── -->
        <section class="space-y-4">
          <div class="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
            <!-- Chiffre principal de la page : un seul, et il est expliqué. -->
            <div class="flex flex-col justify-between gap-6 rounded-2xl border border-default bg-default p-6">
              <div class="flex flex-col gap-1">
                <span class="text-sm text-muted">Effectif présent</span>
                <span class="text-5xl font-bold leading-none text-highlighted">
                  {{ formatCompact(dashboard?.effectif.total) }}
                </span>
              </div>
              <div v-if="compositionEffectif.length" class="flex flex-col gap-3">
                <VizBarreEmpilee :items="compositionEffectif" />
                <p class="text-xs leading-relaxed text-muted">{{ DEFINITION_EFFECTIF_PRESENT }}</p>
              </div>
              <p v-else class="text-xs leading-relaxed text-muted">{{ DEFINITION_EFFECTIF_PRESENT }}</p>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <BaseStatCard
                label="Agents actifs"
                :value="formatCompact(dashboard?.effectif.actifs)"
                icon="i-lucide-user-check"
                hint="En poste, hors stage et hors suspension"
              />
              <BaseStatCard
                label="Stagiaires"
                :value="formatCompact(dashboard?.effectif.stagiaires)"
                icon="i-lucide-graduation-cap"
                hint="Intégrés au titre d'une convention de stage"
                to="/personnel/stagiaires"
              />
              <BaseStatCard
                :label="`Arrivées en ${annee}`"
                :value="formatCompact(dashboard?.mouvements.entrees)"
                icon="i-lucide-log-in"
                :hint="`Prises de service enregistrées en ${annee}`"
              />
              <BaseStatCard
                :label="`Départs en ${annee}`"
                :value="formatCompact(dashboard?.mouvements.sorties)"
                icon="i-lucide-log-out"
                :hint="`Sorties des effectifs en ${annee}`"
              />
            </div>
          </div>

          <p class="text-xs text-muted">
            Les arrivées et les départs portent sur l'année civile {{ annee }}, pas sur les douze
            derniers mois.
          </p>
        </section>

        <!-- ── 2. Ce qui attend une décision de la personne connectée ── -->
        <section class="space-y-4">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <h2 class="text-lg font-semibold text-highlighted">Ce qui vous attend</h2>
            <span v-if="totalFiles" class="text-sm text-muted">
              {{ totalFiles }} dossier(s) arrêté(s) faute de votre décision
            </span>
          </div>

          <p v-if="filesPending" class="text-sm text-muted">Chargement de vos files…</p>

          <div
            v-else-if="!filesEnAttente.length"
            class="flex items-center gap-3 rounded-xl border border-default bg-default p-5"
          >
            <span class="grid size-10 shrink-0 place-items-center rounded-lg bg-success/10 text-success">
              <UIcon name="i-lucide-check-check" class="size-5" />
            </span>
            <div>
              <p class="text-sm font-semibold text-highlighted">Rien ne vous attend</p>
              <p class="text-xs text-muted">Aucun dossier n'est arrêté à une étape qui vous revient.</p>
            </div>
          </div>

          <ul v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <li v-for="file in filesEnAttente" :key="file.cle">
              <NuxtLink
                :to="file.lien"
                class="flex items-center gap-4 rounded-xl border border-default bg-default p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <span class="grid size-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <UIcon :name="file.icone" class="size-5" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block text-2xl font-bold leading-none text-highlighted">{{ file.total }}</span>
                  <span class="mt-1 block truncate text-sm text-toned">{{ file.libelle }}</span>
                  <span class="block text-xs text-muted">{{ file.action }}</span>
                </span>
                <UIcon name="i-lucide-arrow-right" class="size-4 shrink-0 text-dimmed" />
              </NuxtLink>
            </li>
          </ul>
        </section>

        <!-- ── 3. Ce qui n'est pas conforme ── -->
        <section v-if="alertesVisibles.length" class="space-y-4">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <h2 class="text-lg font-semibold text-highlighted">À régulariser</h2>
            <span class="text-sm text-muted">
              {{ totalAlertes }} situation(s) relevée(s) sur {{ alertesVisibles.length }} contrôle(s)
            </span>
          </div>

          <ul class="grid gap-3 sm:grid-cols-2">
            <li
              v-for="alerte in alertesVisibles"
              :key="alerte.code"
              class="flex items-start gap-3 rounded-xl border border-default bg-default p-4"
            >
              <span
                class="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg"
                :style="{ background: `${alerte.couleur}1a`, color: alerte.couleur }"
              >
                <UIcon :name="alerte.icone" class="size-5" />
              </span>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-sm font-semibold text-highlighted">{{ alerte.libelle }}</span>
                  <UBadge :color="alerte.badge" variant="subtle" size="sm">{{ alerte.total }}</UBadge>
                </div>
                <p v-if="alerte.conseil" class="mt-1 text-xs leading-relaxed text-muted">
                  {{ alerte.conseil }}
                </p>
                <UButton
                  v-if="alerte.lien"
                  :to="alerte.lien"
                  variant="link"
                  size="xs"
                  class="mt-1 p-0"
                  trailing-icon="i-lucide-arrow-right"
                >
                  Traiter
                </UButton>
              </div>
            </li>
          </ul>
        </section>

        <!-- ── 4. Masse salariale ── -->
        <section v-if="dashboard?.masse_salariale" class="space-y-4">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <h2 class="text-lg font-semibold text-highlighted">Masse salariale</h2>
            <UButton to="/paie/lots" variant="link" size="sm" trailing-icon="i-lucide-arrow-right">
              Voir les lots de paie
            </UButton>
          </div>

          <div class="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
            <!-- La seule série exacte que le front sache composer : un lot de
                 paie porte son mois et ses totaux, sans ambiguïté. -->
            <div class="rounded-xl border border-default bg-default p-5">
              <div class="flex flex-wrap items-baseline justify-between gap-2">
                <BaseCardTitle icon="i-lucide-trending-up" title="Évolution du net mensuel" />
                <span
                  v-if="variationMasse != null"
                  class="text-sm font-semibold"
                  :class="variationMasse >= 0 ? 'text-warning' : 'text-success'"
                >
                  {{ variationMasse >= 0 ? "+" : "" }}{{ variationMasse.toLocaleString("fr-FR") }} %
                  <span class="font-normal text-muted">sur un mois</span>
                </span>
              </div>
              <p class="mt-1 text-xs text-muted">
                Net réellement versé, mois par mois, d'après les lots de paie validés ou clôturés.
                L'échelle part de zéro.
              </p>
              <div class="mt-4">
                <VizCourbe
                  :points="serieMasse"
                  :format="formatFCFA"
                  vide-label="Il faut au moins deux lots de paie clôturés pour tracer une évolution."
                />
              </div>
            </div>

            <div class="flex flex-col gap-4">
              <div class="rounded-xl border border-default bg-default p-5">
                <BaseCardTitle icon="i-lucide-banknote" :title="`Dernier lot — ${dashboard.masse_salariale.periode}`" />
                <p class="mt-1 text-xs text-muted">
                  {{ dashboard.masse_salariale.nb_lignes }} agent(s) payé(s).
                </p>
                <p class="mt-4 text-3xl font-bold leading-none text-highlighted">
                  {{ formatFCFA(dashboard.masse_salariale.total_net) }}
                </p>
                <p class="mt-1 text-xs text-muted">net à payer</p>
              </div>

              <div class="rounded-xl border border-default bg-default p-5">
                <BaseCardTitle icon="i-lucide-scale" title="Gains et retenues" />
                <p class="mt-1 text-xs text-muted">
                  Ce que pèsent les retenues dans le total brut du mois.
                </p>
                <div class="mt-4">
                  <VizBarreEmpilee
                    :items="[
                      { cle: 'net', libelle: 'Net à payer', total: dashboard.masse_salariale.total_net },
                      { cle: 'retenues', libelle: 'Retenues', total: dashboard.masse_salariale.total_retenues },
                    ]"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ── 5. Campagne d'évaluation, seulement si elle existe ── -->
        <section v-if="campagne && fichesCampagne" class="space-y-4">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <h2 class="text-lg font-semibold text-highlighted">Campagne d'évaluation en cours</h2>
            <UButton to="/evaluations/sessions" variant="link" size="sm" trailing-icon="i-lucide-arrow-right">
              Ouvrir la session
            </UButton>
          </div>

          <div class="grid gap-4 lg:grid-cols-3">
            <div class="rounded-xl border border-default bg-default p-5">
              <BaseCardTitle icon="i-lucide-gauge" title="Fiches finalisées" />
              <p class="mt-1 text-xs text-muted">
                Part des fiches validées par la RH sur l'ensemble des fiches générées.
              </p>
              <div class="mt-4">
                <VizJauge :valeur="fichesFinalisees" :total="fichesCampagne.total" unite="fiches" />
              </div>
            </div>

            <div class="rounded-xl border border-default bg-default p-5">
              <BaseCardTitle icon="i-lucide-star" title="Note moyenne" />
              <p class="mt-1 text-xs text-muted">Moyenne des fiches déjà notées, sur 20.</p>
              <p class="mt-4 text-4xl font-bold leading-none text-highlighted">
                {{ fichesCampagne.moyenne != null ? fichesCampagne.moyenne.toLocaleString("fr-FR") : "—" }}
                <span v-if="fichesCampagne.moyenne != null" class="text-lg font-normal text-muted">/ 20</span>
              </p>
            </div>

            <div class="rounded-xl border border-default bg-default p-5">
              <BaseCardTitle icon="i-lucide-award" title="Mentions attribuées" />
              <p class="mt-1 text-xs text-muted">Répartition des fiches notées par mention.</p>
              <div class="mt-4">
                <!-- Barème ordonné : le trier par volume ferait perdre l'échelle. -->
                <VizBarresH :items="mentionsOrdonnees" ordonne vide-label="Aucune fiche notée" />
              </div>
            </div>
          </div>
        </section>

        <!-- ── 6. Congés et absences ── -->
        <section v-if="conges" class="space-y-4">
          <h2 class="text-lg font-semibold text-highlighted">Congés et absences en {{ annee }}</h2>

          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <BaseStatCard
              label="Agents en congé aujourd'hui"
              :value="formatCompact(conges.demandes.en_conge_aujourd_hui)"
              icon="i-lucide-palmtree"
              hint="Congés accordés couvrant la date du jour"
            />
            <BaseStatCard
              label="Jours accordés"
              :value="formatCompact(conges.demandes.jours_accordes)"
              icon="i-lucide-calendar-check"
              hint="Jours des demandes allées au bout de leur circuit"
            />
            <BaseStatCard
              label="Demandes déposées"
              :value="formatCompact(conges.demandes.total)"
              icon="i-lucide-file-text"
              hint="Toutes demandes confondues sur l'année"
              to="/conges/demandes"
            />
            <BaseStatCard
              label="Absences déclarées"
              :value="formatCompact(conges.absences.total)"
              icon="i-lucide-user-x"
              hint="Absences saisies sur l'année"
              to="/conges/absences"
            />
          </div>

          <div
            v-if="indisponibilitesTracables"
            class="rounded-xl border border-default bg-default p-5"
          >
            <BaseCardTitle icon="i-lucide-trending-up" title="Quand les agents s'absentent" />
            <p class="mt-1 text-xs text-muted">
              Nombre de congés et d'absences <strong class="font-medium text-toned">commençant</strong>
              chaque mois, sur les douze derniers. Les deux courbes comptent des événements, pas des
              jours : elles se lisent sur la même échelle.
            </p>
            <div class="mt-4">
              <VizCourbe
                :series="seriesIndispo"
                vide-label="Pas encore assez d'historique pour tracer une courbe"
              />
            </div>
            <p class="mt-3 border-t border-default pt-3 text-xs text-muted">
              Sur douze mois :
              <template v-for="(t, i) in totauxIndispo" :key="t.cle">
                <span v-if="i">, </span>
                <strong class="font-semibold text-highlighted">{{ t.total }}</strong>
                {{ t.libelle.toLowerCase() }}
              </template>
              .
            </p>
          </div>

          <div v-if="tauxAccordConges" class="rounded-xl border border-default bg-default p-5">
            <BaseCardTitle icon="i-lucide-percent" title="Part des jours demandés qui sont accordés" />
            <p class="mt-1 text-xs text-muted">
              Sur l'ensemble des jours demandés dans l'année, ceux dont le circuit est allé au bout.
            </p>
            <div class="mt-4">
              <VizJauge :valeur="tauxAccordConges.accordes" :total="tauxAccordConges.poses" unite="jours" />
            </div>
          </div>

          <div class="grid gap-4 lg:grid-cols-2">
            <div class="rounded-xl border border-default bg-default p-5">
              <BaseCardTitle icon="i-lucide-git-merge" title="Où en sont les demandes" />
              <p class="mt-1 text-xs text-muted">
                Nombre de demandes à chaque étape du circuit N+1 → RH → DG.
              </p>
              <div class="mt-4">
                <VizBarresH :items="congesParStatut" vide-label="Aucune demande cette année" />
              </div>
            </div>

            <div class="rounded-xl border border-default bg-default p-5">
              <BaseCardTitle icon="i-lucide-list" title="Jours par type de congé" />
              <p class="mt-1 text-xs text-muted">
                Somme des jours demandés, par type — les plus consommés en tête.
              </p>
              <div class="mt-4">
                <VizBarresH
                  :items="conges.demandes.par_type.map((t) => ({ cle: t.cle, libelle: t.libelle, total: t.jours ?? 0 }))"
                  suffixe="j"
                  vide-label="Aucun congé cette année"
                />
              </div>
            </div>
          </div>

          <div v-if="conges.absences.par_type.length" class="rounded-xl border border-default bg-default p-5">
            <BaseCardTitle icon="i-lucide-user-x" title="Absences par motif" />
            <p class="mt-1 text-xs text-muted">
              Nombre d'absences déclarées dans l'année, par type.
            </p>
            <div class="mt-4">
              <VizBarresH :items="conges.absences.par_type" :limite="6" />
            </div>
          </div>
        </section>

        <!-- ── 7. Qui compose l'effectif ── -->
        <section class="space-y-4">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <h2 class="text-lg font-semibold text-highlighted">Qui compose l'effectif</h2>
            <span class="text-sm text-muted">Sur les {{ dashboard?.effectif.total ?? 0 }} agents présents</span>
          </div>

          <!-- Une liste longue à gauche, une part-du-tout à droite : deux formes
               différentes plutôt que six cartes identiques. -->
          <div class="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div v-if="repartitionDirection" class="rounded-xl border border-default bg-default p-5">
              <BaseCardTitle icon="i-lucide-building-2" :title="repartitionDirection.titre" />
              <p class="mt-1 text-xs text-muted">{{ repartitionDirection.explication }}</p>
              <div class="mt-4">
                <VizBarresH :items="repartitionDirection.items" :limite="7" />
              </div>
            </div>

            <div v-if="repartitionGenre" class="rounded-xl border border-default bg-default p-5">
              <BaseCardTitle icon="i-lucide-venus-and-mars" :title="repartitionGenre.titre" />
              <p class="mt-1 text-xs text-muted">{{ repartitionGenre.explication }}</p>
              <div class="mt-4">
                <VizDonut :items="repartitionGenre.items" legende-total="agents" />
              </div>
            </div>
          </div>

          <div class="grid gap-4 lg:grid-cols-2">
            <div v-if="repartitionAge" class="rounded-xl border border-default bg-default p-5">
              <BaseCardTitle icon="i-lucide-cake" :title="repartitionAge.titre" />
              <p class="mt-1 text-xs text-muted">
                {{ repartitionAge.explication }} Les tranches restent dans leur ordre naturel.
              </p>
              <div class="mt-4">
                <!-- Distribution continue découpée en tranches : des colonnes,
                     dans l'ordre des âges, donnent la silhouette d'un coup d'œil. -->
                <VizColonnes :items="repartitionAge.items" />
              </div>
            </div>

            <div class="rounded-xl border border-default bg-default p-5">
              <BaseCardTitle icon="i-lucide-users" title="Situation administrative" />
              <p class="mt-1 text-xs text-muted">
                Tous les agents par statut, y compris ceux qui ne comptent pas dans l'effectif présent.
              </p>
              <div class="mt-4">
                <VizBarresH :items="dashboard?.repartition_statuts ?? []" :limite="10" />
              </div>
            </div>
          </div>

          <!-- Axes secondaires : mêmes barres, en colonnes courtes. -->
          <div v-if="repartitionsSecondaires.length" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div
              v-for="repartition in repartitionsSecondaires"
              :key="repartition.axe"
              class="rounded-xl border border-default bg-default p-5"
            >
              <BaseCardTitle icon="i-lucide-chart-no-axes-column" :title="repartition.titre" />
              <p class="mt-1 text-xs text-muted">{{ repartition.explication }}</p>
              <div class="mt-4">
                <VizBarresH :items="repartition.items" :limite="5" />
              </div>
            </div>
          </div>
        </section>

        <!-- ── 8. Emporter les données ── -->
        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-highlighted">Exporter</h2>
          <p class="text-sm text-muted">
            Les données de {{ annee }}, en tableur ou en PDF, telles qu'elles sont affichées ici.
          </p>
          <div class="flex flex-wrap gap-2">
            <UButton color="neutral" variant="soft" icon="i-lucide-file-spreadsheet" :loading="exportEnCours" @click="exporter('effectifs', 'csv')">
              Effectifs (CSV)
            </UButton>
            <UButton color="neutral" variant="soft" icon="i-lucide-file-down" :loading="exportEnCours" @click="exporter('effectifs', 'pdf')">
              Effectifs (PDF)
            </UButton>
            <UButton color="neutral" variant="soft" icon="i-lucide-file-spreadsheet" :loading="exportEnCours" @click="exporter('conges', 'csv')">
              Congés (CSV)
            </UButton>
            <UButton color="neutral" variant="soft" icon="i-lucide-file-spreadsheet" :loading="exportEnCours" @click="exporter('evaluations', 'csv')">
              Évaluations (CSV)
            </UButton>
          </div>
        </section>
      </div>
    </BaseDataState>
  </BasePanel>
</template>
