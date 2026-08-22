<script setup lang="ts">
/**
 * Zone de dépôt de fichier calée sur la maquette : cadre en pointillés,
 * pastille d'icône, « Glisser-déposer ou choisir un fichier », rappel des
 * formats acceptés. Gère le glisser-déposer et le sélecteur natif.
 *
 * Ne fait **que** choisir le fichier : l'envoi reste la responsabilité de
 * l'appelant (`@select`), qui décide de l'endpoint et du `FormData`.
 */
const props = withDefaults(
  defineProps<{
    label?: string;
    /** Formats affichés en légende (texte libre). */
    accept?: string;
    /** Filtre du sélecteur natif (attribut `accept`). */
    acceptAttr?: string;
    /** Nom du fichier déjà choisi, affiché à la place de l'invite. */
    fileName?: string | null;
    disabled?: boolean;
  }>(),
  {
    label: undefined,
    accept: "PDF, JPEG, PNG",
    acceptAttr: undefined,
    fileName: null,
    disabled: false,
  },
);

const emit = defineEmits<{ select: [File] }>();

const input = useTemplateRef<HTMLInputElement>("input");
const dragging = ref(false);

function pick(file?: File | null) {
  if (!file || props.disabled) return;
  emit("select", file);
}

function onChange(event: Event) {
  pick((event.target as HTMLInputElement).files?.[0]);
}

function onDrop(event: DragEvent) {
  dragging.value = false;
  pick(event.dataTransfer?.files?.[0]);
}
</script>

<template>
  <div class="space-y-2">
    <p v-if="label" class="text-sm font-medium text-highlighted">{{ label }}</p>

    <div
      class="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center transition-colors"
      :class="[
        dragging ? 'border-primary bg-primary/5' : 'border-accented bg-default',
        disabled ? 'opacity-60' : 'cursor-pointer hover:border-primary/60',
      ]"
      @click="!disabled && input?.click()"
      @dragover.prevent="dragging = !disabled"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <span class="grid size-9 place-items-center rounded-lg bg-primary text-inverted">
        <UIcon name="i-lucide-upload" class="size-4" />
      </span>

      <p v-if="fileName" class="truncate text-sm font-medium text-highlighted">{{ fileName }}</p>
      <p v-else class="text-sm text-muted">
        Glisser-déposer ou <span class="font-medium text-primary">choisir un fichier</span>
      </p>
      <p class="text-xs text-dimmed">Formats acceptés : {{ accept }}</p>

      <input
        ref="input"
        type="file"
        class="sr-only"
        :accept="acceptAttr"
        :disabled="disabled"
        @change="onChange"
      >
    </div>
  </div>
</template>
