<script setup lang="ts">
export interface Graduation {
  /** Position le long de la réglette, en pourcentage (0 à 100). */
  position: number;
  /** Texte sous le trait ; vide = trait seul. */
  libelle: string;
}

/**
 * Réglette posée sous une ou plusieurs barres : des traits courts et leurs
 * valeurs, dans l'encre discrète du thème. Elle donne l'échelle sans rien
 * ajouter dans la zone de données.
 *
 * Les libellés d'extrémité s'alignent vers l'intérieur : centrés sur leur
 * trait, ils déborderaient de la carte.
 */
defineProps<{ graduations: Graduation[] }>();

function alignement(position: number): string {
  if (position <= 0) return "translate-x-0";
  if (position >= 100) return "-translate-x-full";
  return "-translate-x-1/2";
}
</script>

<template>
  <div class="relative h-6" aria-hidden="true">
    <span
      v-for="graduation in graduations"
      :key="graduation.position"
      class="absolute top-0 flex flex-col"
      :class="[alignement(graduation.position), graduation.position >= 100 ? 'items-end' : graduation.position <= 0 ? 'items-start' : 'items-center']"
      :style="{ left: `${graduation.position}%` }"
    >
      <span class="block h-1.5 w-px bg-(--ui-border-accented)" />
      <span v-if="graduation.libelle" class="mt-0.5 whitespace-nowrap text-[11px] leading-none text-muted tabular-nums">
        {{ graduation.libelle }}
      </span>
    </span>
  </div>
</template>
