<script setup lang="ts">
import type { ItemRepartition } from "~/schemas/reporting";
import type { Graduation } from "~/components/viz/Graduations.vue";

/**
 * Une barre unique en parts du tout — la forme juste pour deux ou trois
 * catégories (le genre). Un anneau serait moins lisible et un camembert pire.
 *
 * Deux teintes catégorielles validées pour la vision daltonienne, plus un gris
 * neutre pour l'absence de donnée : « non renseigné » n'est pas une catégorie,
 * c'est un trou, et il ne doit pas ressembler à une série.
 *
 * Graduation en quarts sous la barre : la moitié y est chiffrée, parce que c'est
 * le repère qu'on cherche sur une part du tout (parité, poids des retenues).
 */
const props = defineProps<{ items: ItemRepartition[]; videLabel?: string }>();

const QUARTS: Graduation[] = [
  { position: 0, libelle: "0 %" },
  { position: 25, libelle: "" },
  { position: 50, libelle: "50 %" },
  { position: 75, libelle: "" },
  { position: 100, libelle: "100 %" },
];

const total = computed(() => props.items.reduce((somme, i) => somme + i.total, 0));

const segments = computed(() =>
  props.items
    .filter((i) => i.total > 0)
    .map((item, index) => ({
      ...item,
      couleur: couleurPart(item, index),
      part: total.value ? (item.total / total.value) * 100 : 0,
    })),
);
</script>

<template>
  <div v-if="!total" class="py-6 text-center text-sm text-muted">
    {{ videLabel ?? "Aucune donnée" }}
  </div>

  <div v-else class="flex flex-col gap-4">
    <!-- 2px de fond entre les segments : c'est le vide qui sépare, pas un trait. -->
    <div class="flex h-4 w-full gap-[2px] overflow-hidden rounded-[3px]">
      <span
        v-for="segment in segments"
        :key="segment.cle"
        class="h-full first:rounded-l-[3px] last:rounded-r-[3px]"
        :style="{ width: `${segment.part}%`, background: segment.couleur }"
        :title="`${segment.libelle} : ${segment.total} (${Math.round(segment.part)} %)`"
      />
    </div>
    <VizGraduations class="-mt-2.5" :graduations="QUARTS" />

    <ul class="flex flex-wrap gap-x-6 gap-y-2">
      <li v-for="segment in segments" :key="segment.cle" class="flex items-center gap-2">
        <span class="size-2.5 shrink-0 rounded-[2px]" :style="{ background: segment.couleur }" />
        <span class="text-sm text-toned">{{ segment.libelle }}</span>
        <span class="text-sm font-semibold text-highlighted tabular-nums">
          {{ segment.total.toLocaleString("fr-FR") }}
        </span>
        <span class="text-xs text-muted">{{ Math.round(segment.part) }} %</span>
      </li>
    </ul>
  </div>
</template>
