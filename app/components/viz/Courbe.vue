<script setup lang="ts">
import { VIZ } from "~/constants/reporting";

export interface PointSerie {
  /** Clé technique (`YYYY-MM`). */
  cle: string;
  /** Libellé lisible sous l'axe (« août »). */
  libelle: string;
  valeur: number;
}

/**
 * Évolution d'une mesure dans le temps : une aire claire sous une ligne fine,
 * le dernier point marqué et chiffré.
 *
 * Deux partis pris de lecture :
 * - **l'échelle part de zéro.** Sur un montant, tronquer la base exagère
 *   visuellement les variations — une hausse de 2 % ressemblerait à un doublement ;
 * - **on ne chiffre pas tous les points.** Seuls le dernier et le maximum sont
 *   étiquetés ; les autres se lisent au survol. Un nombre sur chaque point ne se
 *   lit plus.
 */
const props = withDefaults(
  defineProps<{
    points: PointSerie[];
    /** Mise en forme des valeurs (montants, jours…). */
    format?: (valeur: number) => string;
    videLabel?: string;
  }>(),
  { format: (v: number) => v.toLocaleString("fr-FR"), videLabel: "Pas encore assez d'historique" },
);

// Repère fixe : le SVG se met à l'échelle sans déformer les traits.
// Les marges ne sont pas décoratives : à gauche, la première étiquette d'axe est
// centrée sous son point et déborderait ; à droite, la valeur du dernier point
// s'écrit en toutes lettres (« 84 500 000 F ») et doit tenir sans être rognée.
const L = 24;
const R = 104;
const T = 26;
const B = 30;
const W = 640;
const H = 220;

const suffisant = computed(() => props.points.length >= 2);
const max = computed(() => Math.max(1, ...props.points.map((p) => p.valeur)));

const coords = computed(() =>
  props.points.map((point, index) => {
    const pas = props.points.length > 1 ? (W - L - R) / (props.points.length - 1) : 0;
    return {
      ...point,
      x: L + index * pas,
      // L'échelle part de zéro : la base du graphique est le zéro réel.
      y: T + (1 - point.valeur / max.value) * (H - T - B),
    };
  }),
);

const ligne = computed(() => coords.value.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" "));
const aire = computed(() => {
  const premier = coords.value[0];
  const dernier = coords.value[coords.value.length - 1];
  if (!premier || !dernier) return "";
  return `${ligne.value} L${dernier.x} ${H - B} L${premier.x} ${H - B} Z`;
});

const dernier = computed(() => coords.value[coords.value.length - 1] ?? null);
const sommet = computed(() => {
  const point = coords.value.reduce((haut, p) => (p.valeur > haut.valeur ? p : haut), coords.value[0]!);
  // Inutile de doubler l'étiquette si le maximum est déjà le dernier point.
  return point && dernier.value && point.cle !== dernier.value.cle ? point : null;
});

/** Étiquettes d'axe : les extrémités toujours, le reste si la place existe. */
const etiquettes = computed(() => {
  const total = coords.value.length;
  const pas = total > 8 ? Math.ceil(total / 6) : 1;
  return coords.value.filter((_, i) => i === 0 || i === total - 1 || i % pas === 0);
});
</script>

<template>
  <p v-if="!suffisant" class="py-8 text-center text-sm text-muted">{{ videLabel }}</p>

  <svg
    v-else
    :viewBox="`0 0 ${W} ${H}`"
    class="h-auto w-full"
    role="img"
    :aria-label="`Évolution sur ${points.length} mois`"
  >
    <!-- Ligne de base : une hairline, jamais un trait pointillé. -->
    <line :x1="L" :y1="H - B" :x2="W - R" :y2="H - B" :stroke="VIZ.piste" stroke-width="1" />

    <path :d="aire" :fill="VIZ.serie" fill-opacity="0.1" />
    <path :d="ligne" fill="none" :stroke="VIZ.serie" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Cible de survol généreuse : le point seul serait trop petit à viser. -->
    <g v-for="point in coords" :key="point.cle">
      <circle :cx="point.x" :cy="point.y" r="12" fill="transparent">
        <title>{{ point.libelle }} : {{ format(point.valeur) }}</title>
      </circle>
    </g>

    <!-- Le dernier point porte un anneau de fond pour rester lisible sur l'aire. -->
    <circle v-if="dernier" :cx="dernier.x" :cy="dernier.y" r="6" fill="#ffffff" />
    <circle v-if="dernier" :cx="dernier.x" :cy="dernier.y" r="4" :fill="VIZ.serie" />
    <text
      v-if="dernier"
      :x="dernier.x + 12"
      :y="dernier.y + 4"
      fill="currentColor"
      class="text-highlighted text-[13px] font-bold"
    >
      {{ format(dernier.valeur) }}
    </text>

    <template v-if="sommet">
      <circle :cx="sommet.x" :cy="sommet.y" r="5" fill="#ffffff" />
      <circle :cx="sommet.x" :cy="sommet.y" r="3" :fill="VIZ.serie" />
      <text
        :x="sommet.x"
        :y="sommet.y - 12"
        text-anchor="middle"
        fill="currentColor"
        class="text-muted text-[11px]"
      >
        {{ format(sommet.valeur) }}
      </text>
    </template>

    <text
      v-for="point in etiquettes"
      :key="`x-${point.cle}`"
      :x="point.x"
      :y="H - 10"
      text-anchor="middle"
      fill="currentColor"
      class="text-muted text-[11px]"
    >
      {{ point.libelle }}
    </text>
  </svg>
</template>
