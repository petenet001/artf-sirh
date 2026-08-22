<script setup lang="ts">
/**
 * Actions de fin de ligne, calées sur la maquette : trio d'icônes discrètes
 * (voir / modifier / supprimer). Chaque action n'apparaît que si elle est
 * demandée — soit par une destination (`viewTo`, `editTo`), soit par un
 * drapeau qui fait remonter l'événement correspondant.
 */
withDefaults(
  defineProps<{
    viewTo?: string;
    editTo?: string;
    /** Rend le crayon en bouton (émet `edit`) plutôt qu'en lien. */
    editable?: boolean;
    /** Affiche la corbeille (émet `remove`). */
    deletable?: boolean;
    /** Nom de l'entité, pour les libellés d'accessibilité. */
    label?: string;
  }>(),
  { viewTo: undefined, editTo: undefined, editable: false, deletable: false, label: "l'élément" },
);

const emit = defineEmits<{ edit: []; remove: [] }>();
</script>

<template>
  <div class="flex items-center justify-end gap-0.5">
    <UButton
      v-if="viewTo"
      :to="viewTo"
      icon="i-lucide-eye"
      color="neutral"
      variant="ghost"
      size="xs"
      :aria-label="`Voir ${label}`"
    />
    <UButton
      v-if="editTo"
      :to="editTo"
      icon="i-lucide-pencil"
      color="neutral"
      variant="ghost"
      size="xs"
      :aria-label="`Modifier ${label}`"
    />
    <UButton
      v-else-if="editable"
      icon="i-lucide-pencil"
      color="neutral"
      variant="ghost"
      size="xs"
      :aria-label="`Modifier ${label}`"
      @click="emit('edit')"
    />
    <UButton
      v-if="deletable"
      icon="i-lucide-trash-2"
      color="error"
      variant="ghost"
      size="xs"
      :aria-label="`Supprimer ${label}`"
      @click="emit('remove')"
    />
  </div>
</template>
