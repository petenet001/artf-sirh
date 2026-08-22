<script setup lang="ts">
/**
 * Ligne d'information façon maquette (« Detailed Information ») : pastille
 * d'icône claire, libellé discret au-dessus de la valeur. Affiche « — » quand
 * la valeur est absente.
 */
defineProps<{ icon: string; label: string; value?: string | number | null }>();
</script>

<template>
  <div class="flex items-start gap-3">
    <span class="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-elevated text-toned">
      <UIcon :name="icon" class="size-4" />
    </span>
    <div class="min-w-0">
      <dt class="text-xs text-muted">{{ label }}</dt>
      <dd class="truncate text-sm font-medium text-highlighted">{{ value ?? "—" }}</dd>
    </div>
  </div>
</template>
