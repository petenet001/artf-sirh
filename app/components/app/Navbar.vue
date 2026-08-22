<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import { branding } from "~/constants/branding";

/**
 * Barre de navigation horizontale **sticky**, calée sur la maquette de
 * référence : bande blanche **pleine largeur** (le contenu, lui, est centré),
 * hauteur compacte, bordure basse fine. De gauche à droite : logo + nom de
 * marque, séparateur vertical, onglets = modules autorisés (l'onglet actif est
 * en `primary` et souligné d'un trait épais collé à la bordure basse), puis
 * l'avatar du menu utilisateur poussé à l'extrémité droite. Sur mobile, les
 * onglets passent dans un menu déroulant.
 */
const { tabs, active, landing } = useModules();

const mobileItems = computed<DropdownMenuItem[][]>(() => [
  tabs.value.map((m) => ({
    label: m.label,
    icon: m.icon,
    to: m.to,
  })),
]);
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-default bg-default">
    <div class="flex h-14 items-center px-4 sm:px-5">
      <!-- Marque → 1er module autorisé -->
      <NuxtLink :to="landing" class="flex shrink-0 items-center gap-2">
        <img :src="branding.logo" :alt="branding.logoAlt" class="size-7 w-auto">
        <span class="text-base font-semibold tracking-tight text-highlighted">
          {{ branding.name }}
        </span>
      </NuxtLink>

      <!-- Séparateur marque / navigation -->
      <span v-if="tabs.length" class="mx-4 hidden h-6 w-px bg-border md:block sm:mx-5" />

      <!-- Onglets (desktop) : soulignement collé à la bordure basse -->
      <nav class="hidden h-full items-stretch gap-7 md:flex">
        <NuxtLink
          v-for="m in tabs"
          :key="m.key"
          :to="m.to"
          class="relative flex items-center px-1 text-sm font-medium transition-colors"
          :class="active?.key === m.key ? 'text-primary' : 'text-muted hover:text-default'"
        >
          {{ m.label }}
          <span
            v-if="active?.key === m.key"
            class="absolute inset-x-0 -bottom-px h-[3px] bg-primary"
          />
        </NuxtLink>
      </nav>

      <div class="ms-auto flex items-center gap-2">
        <!-- Onglets (mobile) -->
        <UDropdownMenu
          v-if="tabs.length"
          :items="mobileItems"
          :content="{ align: 'end' }"
          class="md:hidden"
        >
          <UButton icon="i-lucide-menu" color="neutral" variant="ghost" :label="active?.label" />
        </UDropdownMenu>

        <AppUserMenu />
      </div>
    </div>
  </header>
</template>
