<script setup lang="ts">
/**
 * En-tête « héro » des pages détail (fiche agent, profil…) : carte blanche avec
 * avatar/leading à gauche, identité au centre (titre + sous-titre + méta), et
 * actions à droite. Calé sur la présentation « fiche » des maquettes, en thème
 * ARTF. Les zones sont des slots pour rester générique.
 */
defineProps<{
  title: string;
  subtitle?: string | null;
}>();
</script>

<template>
  <div
    class="flex flex-col gap-5 rounded-3xl border border-default bg-default p-5 shadow-none sm:flex-row sm:items-center">
    <div class="shrink-0">
      <slot name="leading" />
    </div>

    <div class="min-w-0 flex-1">
      <h2 class="truncate text-xl font-bold text-highlighted">{{ title }}</h2>
      <p v-if="subtitle" class="truncate text-sm text-muted">{{ subtitle }}</p>
      <div v-if="$slots.meta" class="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted">
        <slot name="meta" />
      </div>
    </div>

    <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2 sm:justify-end">
      <slot name="actions" />
    </div>
  <
</template>
