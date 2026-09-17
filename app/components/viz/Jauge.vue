<script setup lang="ts">
import { VIZ } from "~/constants/reporting";

/**
 * Jauge d'avancement : une part faite sur un tout, avec la même teinte que la
 * piste en plus clair — l'état se lit sur toute la largeur, pas seulement sur
 * la portion remplie.
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
      class="block h-2.5 w-full rounded-[2px]"
      :style="{ background: VIZ.piste }"
      :title="`${pourcent} % — ${valeur} sur ${total}`"
    >
      <span class="block h-full rounded-r-[4px]" :style="{ width: `${pourcent}%`, background: VIZ.serie }" />
    </span>
  </div>
</template>
