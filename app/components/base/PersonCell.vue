<script setup lang="ts">
/**
 * Cellule « personne » des tables, calée sur la maquette : avatar rond
 * (photo ou initiales) + nom, avec un sous-libellé optionnel (fonction,
 * matricule…). À utiliser dans les colonnes qui désignent quelqu'un.
 */
const props = withDefaults(
  defineProps<{ name: string; subtitle?: string | null; src?: string | null }>(),
  { subtitle: null, src: null },
);

const initials = computed(() =>
  (props.name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?",
);
</script>

<template>
  <div class="flex items-center gap-2.5">
    <UAvatar
      :src="src ?? undefined"
      :alt="name"
      :text="initials"
      size="sm"
      :ui="{ root: 'bg-primary/10 text-primary shrink-0', fallback: 'font-semibold' }"
    />
    <div class="min-w-0">
      <p class="truncate text-sm font-medium text-highlighted">{{ name }}</p>
      <p v-if="subtitle" class="truncate text-xs text-muted">{{ subtitle }}</p>
    </div>
  </div>
</template>
