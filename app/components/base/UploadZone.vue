<script setup lang="ts">
/**
 * Zone de dépôt de fichier : enveloppe `UFileUpload` (Nuxt UI) avec les
 * libellés de l'application — invite de glisser-déposer, rappel des formats
 * acceptés, aperçu du fichier choisi dans le cadre.
 *
 * Deux usages, selon ce que l'appelant fait du fichier :
 * - il le **garde** avant de l'envoyer avec le reste du formulaire →
 *   `v-model="fichier"` ;
 * - il le **dépose aussitôt** (une pièce par une pièce) → `@select` +
 *   `auto-reset`, qui vide la zone pour la pièce suivante.
 *
 * Dans les deux cas l'envoi reste la responsabilité de l'appelant, qui décide
 * de l'endpoint et du `FormData`.
 */
const props = withDefaults(
  defineProps<{
    label?: string;
    /** Formats affichés en légende (texte libre). */
    accept?: string;
    /** Filtre du sélecteur natif (attribut `accept`). */
    acceptAttr?: string;
    /** Vide la zone après la sélection (dépôt immédiat). */
    autoReset?: boolean;
    disabled?: boolean;
  }>(),
  {
    label: undefined,
    accept: "PDF, JPEG, PNG",
    acceptAttr: undefined,
    autoReset: false,
    disabled: false,
  },
);

const emit = defineEmits<{ select: [File] }>();

const file = defineModel<File | null>({ default: null });

watch(file, (value) => {
  if (!value) return;
  emit("select", value);
  if (props.autoReset) file.value = null;
});
</script>

<template>
  <div class="space-y-2">
    <p v-if="label" class="text-sm font-medium text-highlighted">{{ label }}</p>

    <UFileUpload
      v-model="file"
      :accept="acceptAttr"
      :disabled="disabled"
      label="Glisser-déposer ou choisir un fichier"
      :description="`Formats acceptés : ${accept}`"
      icon="i-lucide-upload"
      layout="list"
      position="inside"
      size="lg"
      class="min-h-32 w-full"
    />
  </div>
</template>
