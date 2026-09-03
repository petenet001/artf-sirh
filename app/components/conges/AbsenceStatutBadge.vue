<script setup lang="ts">
import {
  STATUT_ABSENCE_COLOR,
  STATUT_ABSENCE_LABEL,
  type BadgeColor,
  type StatutAbsence,
} from "~/constants/conges";

/** Badge coloré d'un statut d'absence (libellé API prioritaire). */
const props = defineProps<{ statut?: string | null; label?: string | null }>();

const color = computed<BadgeColor>(() => STATUT_ABSENCE_COLOR[props.statut as StatutAbsence] ?? "neutral");
const text = computed(
  () => props.label ?? STATUT_ABSENCE_LABEL[props.statut as StatutAbsence] ?? props.statut ?? "—",
);
</script>

<template>
  <UBadge :color="color" variant="subtle">{{ text }}</UBadge>
</template>
