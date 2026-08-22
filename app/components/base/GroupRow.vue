<script setup lang="ts">
/**
 * Ligne de membre d'une `BaseGroupCard` : avatar + nom + rôle, avec un chevron
 * à droite quand la ligne mène quelque part (cf. maquette « Department »).
 */
defineProps<{
  name: string;
  role?: string | null;
  src?: string | null;
  to?: string;
}>();
</script>

<template>
  <component
    :is="to ? 'NuxtLink' : 'div'"
    :to="to"
    class="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
    :class="to && 'group cursor-pointer'"
  >
    <BasePersonCell :name="name" :subtitle="role" :src="src" class="min-w-0 flex-1" />
    <UIcon
      v-if="to"
      name="i-lucide-chevron-right"
      class="size-4 shrink-0 text-dimmed transition-colors group-hover:text-primary"
    />
  </component>
</template>
