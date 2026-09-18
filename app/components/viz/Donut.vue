<script setup lang="ts">
import { Donut } from "@unovis/ts";
import { VisDonut, VisSingleContainer, VisTooltip } from "@unovis/vue";
import type { ItemRepartition } from "~/schemas/reporting";

/**
 * Anneau de parts du tout — rendu par Unovis (`@unovis/vue`).
 * Réservé aux répartitions **courtes** — six parts au plus, des valeurs
 * franchement différentes : c'est une forme qui se lit d'un coup d'œil, pas une
 * forme qui sert à comparer des valeurs voisines. Au-delà, des barres disent la
 * même chose en mieux.
 *
 * Le centre porte le total : c'est le repère qui manque à un anneau nu. La
 * légende reste en HTML à côté de l'anneau : elle chiffre chaque part.
 */
const props = withDefaults(
  defineProps<{ items: ItemRepartition[]; legendeTotal?: string; videLabel?: string }>(),
  { legendeTotal: "au total", videLabel: "Aucune donnée" },
);

/** Diamètre de l'anneau (px) et épaisseur de l'arc. */
const TAILLE = 144;
const EPAISSEUR = 20;
/** Respiration entre deux parts (radians) : du vide, jamais un trait. */
const ECART = 0.04;

const total = computed(() => props.items.reduce((somme, i) => somme + i.total, 0));

const parts = computed(() =>
  props.items
    .filter((i) => i.total > 0)
    .map((item, index) => ({
      ...item,
      couleur: couleurPart(item, index),
      pourcent: total.value ? Math.round((item.total / total.value) * 100) : 0,
    })),
);

type Part = (typeof parts.value)[number];

const valeur = (p: Part) => p.total;
const couleurDe = (p: Part) => p.couleur;

/** Infobulle d'une part : gabarit HTML synchrone, texte échappé. */
const declencheurs = {
  [Donut.selectors.segment]: ({ data: p }: { data: Part }) =>
    `<p class="flex items-center gap-2 text-xs">
      <span class="size-2 shrink-0 rounded-[2px]" style="background:${p.couleur}"></span>
      <span class="text-toned">${echapperHtml(p.libelle)}</span>
      <span class="font-semibold tabular-nums text-highlighted">${p.total.toLocaleString("fr-FR")}</span>
      <span class="text-muted">${p.pourcent} %</span>
    </p>`,
};
</script>

<template>
  <div v-if="!total" class="py-6 text-center text-sm text-muted">{{ videLabel }}</div>

  <div v-else class="flex flex-wrap items-center gap-x-8 gap-y-5">
    <div
      class="relative shrink-0"
      :style="{ width: `${TAILLE}px` }"
      role="img"
      :aria-label="`Répartition — ${total} ${legendeTotal}`"
    >
      <VisSingleContainer :data="parts" :height="TAILLE" :duration="300">
        <VisDonut
          :value="valeur"
          :color="couleurDe"
          :arc-width="EPAISSEUR"
          :corner-radius="2"
          :pad-angle="ECART"
          :show-background="false"
        />
        <VisTooltip :triggers="declencheurs" />
      </VisSingleContainer>
      <!-- Le texte prend la couleur d'encre du thème, jamais celle d'une part :
           une valeur ne porte pas l'identité d'une série. -->
      <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span class="text-[22px] font-bold text-highlighted">{{ total.toLocaleString("fr-FR") }}</span>
        <span class="mt-1 text-[11px] text-muted">{{ legendeTotal }}</span>
      </div>
    </div>

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
