<script setup lang="ts">
import { statutAgentColor, statutAgentLabel } from "~/constants/personnel";

/**
 * Pastille du statut d'un agent (position CCN). L'API ne fournit pas de
 * libellé : couleur et texte viennent de `constants/personnel.ts`.
 */
defineProps<{ statut?: string | null }>();
</script>

<template>
  <UBadge :color="statutAgentColor(statut)" variant="subtle">{{ statutAgentLabel(statut) }}</UBadge>
</template>
