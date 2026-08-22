<script setup lang="ts">
/**
 * Carte de groupe façon « Department » de la maquette : titre, compteur de
 * membres, lien « Voir tout » à droite, puis la liste des membres en lignes.
 * Sert à présenter une structure (direction, service, bureau) et ses agents.
 *
 * Le corps est libre : on y empile des `BaseGroupRow`.
 */
defineProps<{
  title: string;
  /** Ligne discrète sous le titre (ex. « 20 agents »). */
  meta?: string;
  /** Destination du lien « Voir tout » — masqué si absent. */
  to?: string;
}>();
</script>

<template>
  <section class="rounded-xl border border-default bg-default p-5 shadow-sm">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="truncate text-base font-semibold text-highlighted">{{ title }}</h3>
        <p v-if="meta" class="mt-0.5 text-xs text-muted">{{ meta }}</p>
      </div>
      <NuxtLink v-if="to" :to="to" class="shrink-0 text-sm font-medium text-primary hover:underline">
        Voir tout
      </NuxtLink>
    </div>

    <div class="mt-4 flex flex-col divide-y divide-default">
      <slot />
    </div>
  </section>
</template>
