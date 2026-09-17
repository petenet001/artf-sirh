<script setup lang="ts">
import type { ItemRepartition } from "~/schemas/reporting";
import { VIZ } from "~/constants/reporting";

/**
 * Anneau de parts du tout. Réservé aux répartitions **courtes** — six parts au
 * plus, des valeurs franchement différentes : c'est une forme qui se lit d'un
 * coup d'œil, pas une forme qui sert à comparer des valeurs voisines. Au-delà,
 * des barres disent la même chose en mieux.
 *
 * Le centre porte le total : c'est le repère qui manque à un anneau nu.
 */
const props = withDefaults(
  defineProps<{ items: ItemRepartition[]; legendeTotal?: string; videLabel?: string }>(),
  { legendeTotal: "au total", videLabel: "Aucune donnée" },
);

const RAYON = 52;
const EPAISSEUR = 20;
const CIRCONFERENCE = 2 * Math.PI * RAYON;
/** Respiration entre deux parts : du vide, jamais un trait. */
const ECART = 3;

const total = computed(() => props.items.reduce((somme, i) => somme + i.total, 0));

const parts = computed(() => {
  let depart = 0;

  return props.items
    .filter((i) => i.total > 0)
    .map((item, index) => {
      const fraction = total.value ? item.total / total.value : 0;
      const longueur = Math.max(0, fraction * CIRCONFERENCE - ECART);
      const arc = {
        ...item,
        // Le gris est réservé à l'absence de donnée : « non renseigné » n'est
        // pas une catégorie, il ne doit pas ressembler à une série.
        couleur: /inconnu|non renseign/i.test(item.cle + item.libelle)
          ? VIZ.neutre
          : VIZ.categoriel[index % VIZ.categoriel.length],
        pourcent: Math.round(fraction * 100),
        longueur,
        depart,
      };
      depart += fraction * CIRCONFERENCE;
      return arc;
    });
});
</script>

<template>
  <div v-if="!total" class="py-6 text-center text-sm text-muted">{{ videLabel }}</div>

  <div v-else class="flex flex-wrap items-center gap-x-8 gap-y-5">
    <svg viewBox="0 0 140 140" class="size-36 shrink-0" role="img" :aria-label="`Répartition — ${total} au total`">
      <!-- Piste : ce qui reste visible quand une part est minuscule. -->
      <circle cx="70" cy="70" :r="RAYON" fill="none" :stroke="VIZ.piste" :stroke-width="EPAISSEUR" />
      <circle
        v-for="part in parts"
        :key="part.cle"
        cx="70"
        cy="70"
        :r="RAYON"
        fill="none"
        :stroke="part.couleur"
        :stroke-width="EPAISSEUR"
        :stroke-dasharray="`${part.longueur} ${CIRCONFERENCE - part.longueur}`"
        :stroke-dashoffset="-part.depart"
        transform="rotate(-90 70 70)"
      >
        <title>{{ part.libelle }} : {{ part.total }} ({{ part.pourcent }} %)</title>
      </circle>
      <!-- Le texte prend la couleur d'encre du thème, jamais celle d'une part :
           une valeur ne porte pas l'identité d'une série. -->
      <text x="70" y="66" text-anchor="middle" fill="currentColor" class="text-highlighted text-[22px] font-bold">
        {{ total.toLocaleString("fr-FR") }}
      </text>
      <text x="70" y="84" text-anchor="middle" fill="currentColor" class="text-muted text-[11px]">
        {{ legendeTotal }}
      </text>
    </svg>

    <ul class="flex min-w-0 flex-1 flex-col gap-3">
      <li v-for="part in parts" :key="part.cle" class="flex items-baseline gap-2.5">
        <span class="size-2.5 shrink-0 translate-y-0.5 rounded-[2px]" :style="{ background: part.couleur }" />
        <span class="min-w-0 flex-1 truncate text-sm text-toned">{{ part.libelle }}</span>
        <span class="text-sm font-semibold text-highlighted tabular-nums">
          {{ part.total.toLocaleString("fr-FR") }}
        </span>
        <span class="w-10 text-right text-xs text-muted tabular-nums">{{ part.pourcent }} %</span>
      </li>
    </ul>
  </div>
</template>
