<script setup lang="ts">
/**
 * Couple label / valeur des fiches, calé sur la maquette : libellé discret
 * au-dessus, valeur en dessous, séparateur fin en bas. Affiche « — » quand la
 * valeur est absente. À empiler dans une grille `<dl>` à deux colonnes.
 */
withDefaults(
  defineProps<{
    label: string;
    value?: string | number | null;
    /** Retire le séparateur (dernière ligne d'un bloc, listes compactes). */
    flush?: boolean;
  }>(),
  { value: null, flush: false },
);
</script>

<template>
  <div :class="!flush && 'border-b border-default pb-3'">
    <dt class="text-sm text-muted">{{ label }}</dt>
    <dd class="mt-1 text-sm font-medium text-highlighted">{{ value ?? "—" }}</dd>
  </div>
</template>
