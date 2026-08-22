<script setup lang="ts">
// Layout des écrans non authentifiés : formulaire à gauche, panneau de marque
// (illustration) à droite. Sur mobile, seul le formulaire est affiché.
// Libellés de marque : `constants/branding.ts`.
import { branding } from "~/constants/branding";
</script>

<template>
  <div class="grid min-h-screen lg:grid-cols-2">
    <!-- Colonne formulaire -->
    <div class="flex items-center justify-center p-6 sm:p-10">
      <div class="w-full max-w-sm">
        <slot />
      </div>
    </div>

    <!-- Colonne marque / illustration -->
    <!-- Couleurs via les jetons du thème (app.config.ts), jamais en dur :
         `bg-primary` = bleu ARTF, `bg-secondary` = rouge ARTF. -->
    <div class="relative hidden overflow-hidden bg-primary p-12 text-inverted lg:flex lg:flex-col lg:justify-between">
      <div class="relative z-10 flex items-center gap-2 text-lg font-semibold">
        <UIcon name="i-lucide-building-2" class="size-6" />
        <span>{{ branding.shortName }}</span>
      </div>

      <div class="relative z-10 max-w-md">
        <div class="mb-6 h-1.5 w-14 rounded-full bg-secondary" />
        <h2 class="text-3xl font-bold leading-tight">
          {{ branding.fullName }}
        </h2>
        <p class="mt-4 text-inverted/70">
          {{ branding.tagline }}
        </p>
      </div>

      <p class="relative z-10 text-sm text-inverted/50">{{ branding.copyright }}</p>

      <!-- Décor -->
      <div class="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-white/5" />
      <div class="pointer-events-none absolute -bottom-28 -left-16 size-96 rounded-full bg-white/5" />
      <UIcon name="i-lucide-users" class="pointer-events-none absolute bottom-28 right-12 size-44 text-white/5" />
    </div>
  </div>
</template>
