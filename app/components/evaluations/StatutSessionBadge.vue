<script setup lang="ts">
import {
  STATUT_SESSION_COLOR,
  STATUT_SESSION_LABEL,
  type BadgeColor,
  type StatutSessionEvaluation,
} from "~/constants/evaluations";

/** Badge coloré d'un statut de session d'évaluation. */
const props = defineProps<{ statut?: string | null; label?: string | null }>();

const color = computed<BadgeColor>(
  () => STATUT_SESSION_COLOR[props.statut as StatutSessionEvaluation] ?? "neutral",
);
const text = computed(
  () => props.label ?? STATUT_SESSION_LABEL[props.statut as StatutSessionEvaluation] ?? props.statut ?? "—",
);
</script>

<template>
  <UBadge :color="color" variant="subtle">{{ text }}</UBadge>
</template>
