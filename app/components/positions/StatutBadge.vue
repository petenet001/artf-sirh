<script setup lang="ts">
import {
  STATUT_POSITION_COLOR,
  STATUT_POSITION_LABEL,
  type BadgeColor,
  type StatutPosition,
} from "~/constants/positions";

/** Badge coloré d'un statut de position conventionnelle. */
const props = defineProps<{ statut?: string | null; label?: string | null }>();

const color = computed<BadgeColor>(() => STATUT_POSITION_COLOR[props.statut as StatutPosition] ?? "neutral");
const text = computed(
  () => props.label ?? STATUT_POSITION_LABEL[props.statut as StatutPosition] ?? props.statut ?? "—",
);
</script>

<template>
  <UBadge :color="color" variant="subtle">{{ text }}</UBadge>
</template>
