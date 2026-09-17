<script setup lang="ts">
import {
  STATUT_PLAN_COLOR,
  STATUT_PLAN_LABEL,
  type BadgeColor,
  type StatutPlanFormation,
} from "~/constants/formations";

/** Badge coloré d'un statut de plan annuel de formation. */
const props = defineProps<{ statut?: string | null; label?: string | null }>();

const color = computed<BadgeColor>(() => STATUT_PLAN_COLOR[props.statut as StatutPlanFormation] ?? "neutral");
const text = computed(
  () => props.label ?? STATUT_PLAN_LABEL[props.statut as StatutPlanFormation] ?? props.statut ?? "—",
);
</script>

<template>
  <UBadge :color="color" variant="subtle">{{ text }}</UBadge>
</template>
