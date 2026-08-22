<script setup lang="ts">
/**
 * En-tête de carte façon maquette : pastille d'icône foncée et ronde suivie du
 * titre. Reproduit les en-têtes « Business Summary » / « Detailed Information ».
 */
defineProps<{ icon: string; title: string }>();
</script>

<template>
  <div class="flex items-center gap-2.5">
    <span class="flex size-7 shrink-0 items-center justify-center rounded-full bg-inverted text-inverted">
      <UIcon :name="icon" class="size-4" />
    </span>
    <span class="font-medium text-highlighted">{{ title }}</span>
  </div>
</template>
