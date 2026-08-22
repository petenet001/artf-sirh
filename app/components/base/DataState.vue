<script setup lang="ts">
/**
 * Gère les trois états d'un écran de données : chargement, erreur, vide.
 * Centralise ici ce qui était dupliqué dans chaque page.
 * Affiche le slot par défaut uniquement quand tout est OK.
 */
defineProps<{
  pending?: boolean;
  error?: unknown;
  empty?: boolean;
  emptyLabel?: string;
}>();
</script>

<template>
  <div>
    <div v-if="pending" class="flex flex-col items-center justify-center py-12 gap-2">
      <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin text-muted" />
      <p class="text-sm text-muted">Chargement…</p>
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      variant="subtle"
      icon="i-lucide-alert-triangle"
      title="Impossible de charger les données"
    />

    <div v-else-if="empty" class="flex flex-col items-center justify-center py-12 gap-2">
      <UIcon name="i-lucide-inbox" class="size-6 text-muted" />
      <p class="text-sm text-muted">{{ emptyLabel ?? "Aucun élément à afficher" }}</p>
    </div>

    <slot v-else />
  </div>
</template>
