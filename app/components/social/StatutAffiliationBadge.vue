<script setup lang="ts">
import {
  STATUT_AFFILIATION_COLOR,
  STATUT_AFFILIATION_LABEL,
  type BadgeColor,
  type StatutAffiliation,
} from "~/constants/social";

/** Badge coloré d'un statut d'affiliation sociale. */
const props = defineProps<{ statut?: string | null; label?: string | null }>();

const color = computed<BadgeColor>(
  () => STATUT_AFFILIATION_COLOR[props.statut as StatutAffiliation] ?? "neutral",
);
const text = computed(
  () => props.label ?? STATUT_AFFILIATION_LABEL[props.statut as StatutAffiliation] ?? props.statut ?? "—",
);
</script>

<template>
  <UBadge :color="color" variant="subtle">{{ text }}</UBadge>
</template>
