<script setup lang="ts">
/**
 * Coquille de page : grand titre + sous-titre, actions à droite, puis la
 * sous-navigation du module (pastilles) et le corps. Style calé sur la maquette
 * (contenu centré fourni par le layout, en-tête typographique fort).
 * `icon` est conservé pour compatibilité mais n'est plus rendu (titre nu).
 */
defineProps<{
  title?: string;
  subtitle?: string;
  icon?: string;
}>();
</script>

<template>
  <section class="space-y-6">
    <div class="space-y-4">
      <div
        v-if="title || subtitle || $slots.actions"
        class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
      >
        <div class="min-w-0">
          <h1 v-if="title" class="text-2xl font-bold tracking-tight text-highlighted sm:text-3xl">
            {{ title }}
          </h1>
          <p v-if="subtitle" class="mt-1.5 text-muted">{{ subtitle }}</p>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <slot name="actions" />
        </div>
      </div>

      <AppModuleNav />
    </div>

    <slot />
  </section>
</template>
