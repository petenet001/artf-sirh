<script setup lang="ts">
import {
  STATUT_SANCTION_COLOR,
  STATUT_SANCTION_LABEL,
  type BadgeColor,
  type StatutSanction,
} from "~/constants/discipline";

/** Badge coloré d'un statut de dossier disciplinaire (vocabulaire CCN). */
const props = defineProps<{ statut?: string | null; label?: string | null }>();

const color = computed<BadgeColor>(() => STATUT_SANCTION_COLOR[props.statut as StatutSanction] ?? "neutral");
const text = computed(
  () => props.label ?? STATUT_SANCTION_LABEL[props.statut as StatutSanction] ?? props.statut ?? "—",
);
</script>

<template>
  <UBadge :color="color" variant="subtle">{{ text }}</UBadge>
</template>
