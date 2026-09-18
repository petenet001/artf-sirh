<script setup lang="ts">
import { CurveType } from "@unovis/ts";
import { VisAxis, VisArea, VisCrosshair, VisLine, VisTooltip, VisXYContainer } from "@unovis/vue";
import { VIZ } from "~/constants/reporting";

export interface PointSerie {
  /** Clé technique (`YYYY-MM`). */
  cle: string;
  /** Libellé lisible sous l'axe (« août »). */
  libelle: string;
  valeur: number;
}

export interface SerieCourbe {
  cle: string;
  /** Nom de la série, porté par la légende. */
  libelle: string;
  points: PointSerie[];
}

/** Une ligne de données du graphique : une période, une colonne par série. */
type LignePeriode = { _cle: string; _libelle: string } & Record<string, number | string>;

/**
 * Évolution d'une ou deux mesures dans le temps — rendu par Unovis
 * (`@unovis/vue`), habillé aux couleurs ARTF (`main.css`, variables `--vis-*`).
 *
 * Partis pris de lecture :
 * - **l'échelle part de zéro** et s'arrête sur une valeur ronde (`echelleRonde`) :
 *   sur un montant, tronquer la base exagère visuellement les variations — une
 *   hausse de 2 % ressemblerait à un doublement ;
 * - **on ne chiffre pas tous les points.** Le quadrillage gradué donne l'ordre de
 *   grandeur, la dernière valeur est écrite au-dessus du graphique, le reste se
 *   lit au survol (réticule + infobulle, au doigt comme à la souris) ;
 * - **une seule échelle, même à deux séries.** Superposer deux mesures n'est
 *   légitime que si elles partagent leur unité (ici : des demandes). Deux axes Y
 *   permettraient de faire dire n'importe quoi à la comparaison — on ne le fait
 *   jamais. À deux séries, l'aire disparaît (deux aires superposées se
 *   brouillent) et la légende porte la dernière valeur de chacune.
 */
const props = withDefaults(
  defineProps<{
    /** Série unique. Ignoré si `series` est fourni. */
    points?: PointSerie[];
    /** Deux séries comparables, de même unité. */
    series?: SerieCourbe[];
    /** Mise en forme des valeurs (montants, jours…). */
    format?: (valeur: number) => string;
    videLabel?: string;
  }>(),
  {
    points: () => [],
    series: () => [],
    format: (v: number) => v.toLocaleString("fr-FR"),
    videLabel: "Pas encore assez d'historique",
  },
);

const HAUTEUR = 220;

const series = computed<SerieCourbe[]>(() =>
  props.series.length ? props.series : [{ cle: "valeur", libelle: "", points: props.points }],
);
const multi = computed(() => series.value.length > 1);

/** Couleur : une mesure unique prend le bleu de marque, deux prennent la paire catégorielle. */
function couleur(index: number) {
  return multi.value ? (VIZ.categoriel[index] ?? VIZ.neutre) : VIZ.serie;
}

/** Axe des X = union des périodes rencontrées. Les clés `YYYY-MM` se trient à plat. */
const periodes = computed(() => {
  const vues = new Map<string, string>();
  for (const serie of series.value) {
    for (const point of serie.points) if (!vues.has(point.cle)) vues.set(point.cle, point.libelle);
  }
  return [...vues.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([cle, libelle]) => ({ cle, libelle }));
});

const suffisant = computed(() => periodes.value.length >= 2);

/** Une période absente d'une série vaut zéro : la grille de mois fait foi. */
const lignes = computed<LignePeriode[]>(() => {
  const index = series.value.map((s) => new Map(s.points.map((p) => [p.cle, p.valeur])));
  return periodes.value.map((periode) => {
    const ligne: LignePeriode = { _cle: periode.cle, _libelle: periode.libelle };
    series.value.forEach((serie, i) => {
      ligne[serie.cle] = index[i]!.get(periode.cle) ?? 0;
    });
    return ligne;
  });
});

const echelle = computed(() =>
  echelleRonde(Math.max(0, ...series.value.flatMap((s) => s.points.map((p) => p.valeur)))),
);

/** Étiquettes d'axe : les extrémités toujours, le reste si la place existe. */
const ticksX = computed(() => {
  const total = periodes.value.length;
  const pas = total > 8 ? Math.ceil(total / 6) : 1;
  return periodes.value.map((_, i) => i).filter((i) => i === 0 || i === total - 1 || i % pas === 0);
});

function libelleX(tick: number): string {
  return periodes.value[tick]?.libelle ?? "";
}

/** Mois en toutes lettres pour l'infobulle : « août 2026 ». */
function libellePeriode(ligne: LignePeriode | undefined): string {
  if (!ligne) return "";
  return `${ligne._libelle} ${ligne._cle.slice(0, 4)}`;
}

function valeurDe(ligne: LignePeriode | undefined, cle: string): number {
  return Number(ligne?.[cle] ?? 0);
}

const derniere = computed(() => lignes.value[lignes.value.length - 1]);

const abscisse = (_: LignePeriode, i: number) => i;
const ordonnees = computed(() => series.value.map((serie) => (ligne: LignePeriode) => valeurDe(ligne, serie.cle)));
const couleurSerie = (_: unknown, i: number) => couleur(i);

/**
 * Infobulle du réticule. Unovis appelle ce gabarit de façon synchrone avec la
 * période survolée et attend du HTML : le contenu est donc toujours celui du
 * point sous le curseur — un rendu Vue différé, lui, aurait un survol de
 * retard. Tout texte est échappé.
 */
function infobulle(ligne: LignePeriode): string {
  const lignes = series.value
    .map((serie, i) => {
      const nom = multi.value ? `<span class="flex-1 text-muted">${echapperHtml(serie.libelle)}</span>` : "";
      return `<p class="flex items-center gap-2">
        <span class="size-2 shrink-0 rounded-full" style="background:${couleur(i)}"></span>${nom}
        <span class="ml-auto font-semibold tabular-nums text-highlighted">${echapperHtml(props.format(valeurDe(ligne, serie.cle)))}</span>
      </p>`;
    })
    .join("");
  return `<div class="flex min-w-40 flex-col gap-1.5 text-xs">
    <p class="font-semibold text-highlighted">${echapperHtml(libellePeriode(ligne))}</p>${lignes}
  </div>`;
}
</script>

<template>
  <div>
    <p v-if="!suffisant" class="py-8 text-center text-sm text-muted">{{ videLabel }}</p>

    <template v-else>
      <!-- Légende obligatoire dès deux séries : la couleur seule ne doit jamais
           porter l'identité. Elle affiche aussi la dernière valeur, que le
           graphique ne peut pas étiqueter sans collision. En série unique, la
           dernière valeur seule, sans pastille : le titre de la carte nomme la mesure. -->
      <ul class="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1" :class="{ 'justify-end': !multi }">
        <li v-for="(serie, i) in series" :key="serie.cle" class="flex items-center gap-2 text-xs">
          <span v-if="multi" class="size-2.5 shrink-0 rounded-full" :style="{ backgroundColor: couleur(i) }" />
          <span class="text-muted">{{ multi ? serie.libelle : libellePeriode(derniere) }}</span>
          <span class="font-semibold tabular-nums text-highlighted">
            {{ format(valeurDe(derniere, serie.cle)) }}
          </span>
        </li>
      </ul>

      <div role="img" :aria-label="`Évolution sur ${periodes.length} mois`">
        <VisXYContainer
          :data="lignes"
          :height="HAUTEUR"
          :y-domain="[0, echelle.borne]"
          :padding="{ top: 8, right: 16 }"
          :duration="300"
        >
          <!-- Aire en aplat à 10 % sous une série unique ; à deux séries, les
               aires superposées se brouilleraient. -->
          <VisArea
            v-if="!multi"
            :x="abscisse"
            :y="ordonnees[0]"
            :color="couleur(0)"
            :opacity="0.1"
            :curve-type="CurveType.Linear"
          />
          <VisLine
            :x="abscisse"
            :y="ordonnees"
            :color="couleurSerie"
            :line-width="2"
            :curve-type="CurveType.Linear"
          />
          <VisAxis
            type="x"
            :tick-values="ticksX"
            :tick-format="libelleX"
            :grid-line="false"
            :domain-line="false"
            :tick-line="false"
          />
          <!-- La graduation : quadrillage aux valeurs rondes de `echelleRonde`. -->
          <VisAxis
            type="y"
            :tick-values="echelle.graduations"
            :tick-format="formatGraduation"
            :grid-line="true"
            :domain-line="false"
            :tick-line="false"
          />
          <VisCrosshair :template="infobulle" :color="couleurSerie" />
          <VisTooltip />
        </VisXYContainer>
      </div>
    </template>
  </div>
</template>
