<script setup lang="ts">
import {
  STATUT_DEMANDE_COLOR,
  STATUT_DEMANDE_LABEL,
  type BadgeColor,
  type StatutDemandeConge,
} from "~/constants/conges";

/**
 * Badge coloré d'un statut de demande de congé. Le libellé fourni par l'API
 * (`statut_label`) prime ; on ne calcule que la couleur (repli neutre).
 */
const props = defineProps<{ statut?: string | null; label?: string | null }>();

const color = computed<BadgeColor>(() => STATUT_DEMANDE_COLOR[props.statut as StatutDemandeConge] ?? "neutral");
const text = computed(
  () => props.label ?? STATUT_DEMANDE_LABEL[props.statut as StatutDemandeConge] ?? props.statut ?? "—",
);
</script>

<template>
  <UBadge :color="color" variant="subtle">{{ text }}</UBadge>
</template>
