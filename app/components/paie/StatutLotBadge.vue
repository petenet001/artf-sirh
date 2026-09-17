<script setup lang="ts">
import {
  STATUT_PAIE_LOT_COLOR,
  STATUT_PAIE_LOT_LABEL,
  type BadgeColor,
  type StatutPaieLot,
} from "~/constants/paie";

/** Badge coloré d'un statut de lot de paie. */
const props = defineProps<{ statut?: string | null; label?: string | null }>();

const color = computed<BadgeColor>(() => STATUT_PAIE_LOT_COLOR[props.statut as StatutPaieLot] ?? "neutral");
const text = computed(
  () => props.label ?? STATUT_PAIE_LOT_LABEL[props.statut as StatutPaieLot] ?? props.statut ?? "—",
);
</script>

<template>
  <UBadge :color="color" variant="subtle">{{ text }}</UBadge>
</template>
