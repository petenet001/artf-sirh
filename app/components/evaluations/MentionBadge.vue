<script setup lang="ts">
import { MENTION_COLOR, type BadgeColor, type MentionEvaluation } from "~/constants/evaluations";

/**
 * Note globale /20 et mention (CCN art. 63). La mention est déjà un libellé
 * côté API (« Très bien ») : on ne mappe que la couleur.
 */
const props = defineProps<{ note?: number | null; mention?: string | null }>();

const color = computed<BadgeColor>(() => MENTION_COLOR[props.mention as MentionEvaluation] ?? "neutral");
const note = computed(() =>
  props.note == null ? null : `${props.note.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}/20`,
);
</script>

<template>
  <span v-if="note || mention" class="inline-flex items-center gap-2">
    <span v-if="note" class="text-sm font-semibold text-highlighted">{{ note }}</span>
    <UBadge v-if="mention" :color="color" variant="subtle">{{ mention }}</UBadge>
  </span>
  <span v-else class="text-sm text-muted">—</span>
</template>
