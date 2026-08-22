<script setup lang="ts">
/**
 * Carte de statistique calée sur la maquette : pastille d'icône teintée en haut
 * à gauche, point de statut en haut à droite, libellé discret puis grande
 * valeur. Carte blanche à bordure fine et ombre douce ; devient un lien au survol
 * si `to` est fourni. `hint` = légende optionnelle sous la valeur.
 */
defineProps<{
  label: string;
  value: number | string;
  icon: string;
  to?: string;
  hint?: string;
}>();
</script>

<template>
  <component
    :is="to ? 'NuxtLink' : 'div'"
    :to="to"
    class="flex flex-col gap-6 rounded-3xl border border-default bg-default p-5 shadow-none transition"
    :class="to && 'hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md'"
  >
    <div class="flex items-start justify-between">
      <span class="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <UIcon :name="icon" class="size-5" />
      </span>
      <span class="mt-1 size-1.5 rounded-full bg-primary/70" />
    </div>

    <div class="space-y-1">
      <p class="truncate text-sm text-muted">{{ label }}</p>
      <p class="text-3xl font-bold leading-none text-highlighted">{{ value }}</p>
      <p v-if="hint" class="truncate text-xs text-muted">{{ hint }}</p>
    </div>
  </component>
</template>
