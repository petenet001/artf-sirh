<script setup lang="ts">
import {
  STATUT_CARRIERE_COLOR,
  STATUT_CARRIERE_LABEL,
  type BadgeColor,
  type StatutCarriere,
} from "~/constants/carriere";

/**
 * Badge coloré d'un statut de carrière (affectation ou nomination). Le libellé
 * fourni par l'API (`statut_label`) prime toujours ; on ne calcule que la
 * couleur, avec un repli neutre pour un statut inconnu.
 */
const props = defineProps<{ statut?: string | null; label?: string | null }>();

const color = computed<BadgeColor>(
  () => STATUT_CARRIERE_COLOR[props.statut as StatutCarriere] ?? "neutral",
);
const text = computed(
  () =>
    props.label ??
    STATUT_CARRIERE_LABEL[props.statut as StatutCarriere] ??
    props.statut ??
    "—",
);
</script>

<template>
  <UBadge :color="color" variant="subtle">{{ text }}</UBadge>
</template>
