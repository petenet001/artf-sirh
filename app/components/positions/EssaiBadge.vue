<script setup lang="ts">
import {
  STATUT_ESSAI_COLOR,
  STATUT_ESSAI_LABEL,
  type BadgeColor,
  type StatutEssai,
} from "~/constants/positions";
import type { Essai } from "~/schemas/essai";

/**
 * État de la période d'essai (CCN art. 49 / 50) : statut, durée et échéance.
 * Rien n'est affiché quand l'essai n'est pas applicable (stage, consultance).
 */
const props = defineProps<{ essai?: Essai | null }>();

const visible = computed(() => !!props.essai?.statut && props.essai.statut !== "non_applicable");
const color = computed<BadgeColor>(() => STATUT_ESSAI_COLOR[props.essai?.statut as StatutEssai] ?? "neutral");
const text = computed(
  () => props.essai?.statut_label ?? STATUT_ESSAI_LABEL[props.essai?.statut as StatutEssai] ?? "—",
);
</script>

<template>
  <span v-if="visible" class="inline-flex items-center gap-2">
    <UBadge :color="color" variant="subtle">{{ text }}</UBadge>
    <span v-if="essai?.date_fin" class="text-xs text-muted">
      jusqu'au {{ formatDate(essai.date_fin) }}
      <span v-if="essai.duree_mois"> ({{ essai.duree_mois }} mois)</span>
    </span>
  </span>
</template>
