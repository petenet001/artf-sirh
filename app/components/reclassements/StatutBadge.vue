<script setup lang="ts">
import {
  STATUT_RECLASSEMENT_COLOR,
  STATUT_RECLASSEMENT_LABEL,
  type BadgeColor,
  type StatutReclassement,
} from "~/constants/reclassements";

/** Badge coloré d'un statut de dossier de reclassement. */
const props = defineProps<{ statut?: string | null; label?: string | null }>();

const color = computed<BadgeColor>(
  () => STATUT_RECLASSEMENT_COLOR[props.statut as StatutReclassement] ?? "neutral",
);
const text = computed(
  () => props.label ?? STATUT_RECLASSEMENT_LABEL[props.statut as StatutReclassement] ?? props.statut ?? "—",
);
</script>

<template>
  <UBadge :color="color" variant="subtle">{{ text }}</UBadge>
</template>
