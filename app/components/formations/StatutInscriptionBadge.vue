<script setup lang="ts">
import {
  STATUT_INSCRIPTION_COLOR,
  STATUT_INSCRIPTION_LABEL,
  type BadgeColor,
  type StatutInscriptionFormation,
} from "~/constants/formations";

/** Badge coloré d'un statut d'inscription à une formation. */
const props = defineProps<{ statut?: string | null; label?: string | null }>();

const color = computed<BadgeColor>(
  () => STATUT_INSCRIPTION_COLOR[props.statut as StatutInscriptionFormation] ?? "neutral",
);
const text = computed(
  () =>
    props.label ?? STATUT_INSCRIPTION_LABEL[props.statut as StatutInscriptionFormation] ?? props.statut ?? "—",
);
</script>

<template>
  <UBadge :color="color" variant="subtle">{{ text }}</UBadge>
</template>
