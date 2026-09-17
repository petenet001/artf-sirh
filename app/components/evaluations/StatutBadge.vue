<script setup lang="ts">
import {
  STATUT_EVALUATION_COLOR,
  STATUT_EVALUATION_LABEL,
  type BadgeColor,
  type StatutEvaluation,
} from "~/constants/evaluations";

/**
 * Badge coloré d'un statut de fiche d'évaluation. Le libellé fourni par l'API
 * (`statut_label`) prime ; on ne calcule que la couleur (repli neutre).
 */
const props = defineProps<{ statut?: string | null; label?: string | null }>();

const color = computed<BadgeColor>(
  () => STATUT_EVALUATION_COLOR[props.statut as StatutEvaluation] ?? "neutral",
);
const text = computed(
  () => props.label ?? STATUT_EVALUATION_LABEL[props.statut as StatutEvaluation] ?? props.statut ?? "—",
);
</script>

<template>
  <UBadge :color="color" variant="subtle">{{ text }}</UBadge>
</template>
