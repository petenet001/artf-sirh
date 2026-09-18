<script setup lang="ts">
import { VIZ } from "~/constants/reporting";

/**
 * Jauge d'avancement : une part faite sur un tout, avec la même teinte que la
 * piste en plus clair — l'état se lit sur toute la largeur, pas seulement sur
 * la portion remplie. Des encoches du fond la graduent en quarts : on situe
 * « un peu plus de la moitié » sans avoir à lire le pourcentage.
 */
const props = withDefaults(
  defineProps<{ valeur: number; total: number; unite?: string }>(),
  { unite: "" },
);

const pourcent = computed(() => (props.total > 0 ? Math.round((props.valeur / props.total) * 100) : 0));
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-baseline justify-between gap-3">
      <span class="text-2xl font-bold leading-none text-highlighted">{{ pourcent }} %</span>
      <span class="text-sm text-muted tabular-nums">
        {{ valeur.toLocaleString("fr-FR") }} sur {{ total.toLocaleString("fr-FR") }}
        <span v-if="unite">{{ unite }}</span>
      </span>
    </div>
    <span
      class="relative block h-2.5 w-full rounded-[2px]"
      :style="{ background: VIZ.piste }"
      :title="`${pourcent} % — ${valeur} sur ${total}`"
    >
      <span
        v-for="quart in [25, 50, 75]"
        :key="quart"
        class="absolute inset-y-0 w-px"
        :style="{ left: `${quart}%`, background: VIZ.encoche }"
      />
      <span
        class="relative block h-full rounded-r-[4px]"
        :style="{ width: `${Math.min(100, pourcent)}%`, background: VIZ.serie }"
      />
    </span>
  </div>
</template>
