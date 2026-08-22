<script setup lang="ts">
/**
 * Navigation verticale en carte (colonne de gauche des fiches, cf. maquette) :
 * entrée active en plein `primary`, les autres en gris avec survol discret.
 * Pilotée par `v-model` (clé de l'entrée active) ou par des liens (`to`).
 */
import type { SideNavItem } from "~/types/sidenav";

defineProps<{ items: SideNavItem[] }>();
const model = defineModel<string>();
</script>

<template>
  <nav class="flex flex-col gap-1 rounded-xl border border-default bg-default p-3">
    <component
      :is="item.to ? 'NuxtLink' : 'button'"
      v-for="item in items"
      :key="item.key"
      :to="item.to"
      :type="item.to ? undefined : 'button'"
      class="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
      :class="model === item.key
        ? 'bg-primary text-inverted'
        : 'text-muted hover:bg-elevated hover:text-highlighted'"
      @click="model = item.key"
    >
      <UIcon v-if="item.icon" :name="item.icon" class="size-4 shrink-0" />
      <span class="truncate">{{ item.label }}</span>
    </component>
  </nav>
</template>
