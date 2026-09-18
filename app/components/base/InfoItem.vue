<script setup lang="ts">
/**
 * Ligne d'information façon maquette (« Detailed Information ») : pastille
 * d'icône claire, libellé discret au-dessus de la valeur. Affiche « — » quand
 * la valeur est absente.
 *
 * `to` rend la valeur cliquable quand elle désigne une autre fiche (la demande
 * de congé liée à un arrêt, par exemple). Sans `to`, rien ne change : on ne
 * veut pas d'un soulignement décoratif sur une valeur qui ne mène nulle part.
 */
defineProps<{
  icon: string;
  label: string;
  value?: string | number | null;
  to?: string;
}>();
</script>

<template>
  <div class="flex items-start gap-3">
    <span class="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-elevated text-toned">
      <UIcon :name="icon" class="size-4" />
    </span>
    <div class="min-w-0">
      <dt class="text-xs text-muted">{{ label }}</dt>
      <dd class="truncate text-sm font-medium text-highlighted">
        <ULink v-if="to && value != null" :to="to" class="text-primary hover:underline">
          {{ value }}
        </ULink>
        <template v-else>{{ value ?? "—" }}</template>
      </dd>
    </div>
  </div>
</template>
