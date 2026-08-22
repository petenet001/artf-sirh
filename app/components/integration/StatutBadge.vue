<script setup lang="ts">
import { STATUT_META, type DossierStatut, type BadgeColor } from "~/constants/integration-workflow";

/** Badge coloré d'un statut de dossier. Le libellé API (`statut_label`) prime. */
const props = defineProps<{ statut?: DossierStatut | null; label?: string | null }>();

const meta = computed<{ label: string; color: BadgeColor }>(() =>
  props.statut && STATUT_META[props.statut]
    ? STATUT_META[props.statut]
    : { label: props.label ?? props.statut ?? "—", color: "neutral" },
);
</script>

<template>
  <UBadge :color="meta.color" variant="subtle">{{ label ?? meta.label }}</UBadge>
</template>
