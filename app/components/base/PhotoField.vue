<script setup lang="ts">
/**
 * Emplacement photo des formulaires d'identité, calé sur la maquette : carré
 * arrondi avec une icône d'appareil photo, qui affiche l'aperçu une fois une
 * image choisie.
 *
 * `disabled` sert aux cas où l'API n'expose pas encore l'envoi de la photo :
 * l'emplacement reste visible (mise en page identique) mais inerte, avec son
 * explication en légende — on n'affiche jamais un contrôle qui ferait croire à
 * un enregistrement inexistant.
 */
const props = withDefaults(
  defineProps<{ src?: string | null; alt?: string; disabled?: boolean; hint?: string }>(),
  { src: null, alt: "Photo", disabled: false, hint: undefined },
);

const emit = defineEmits<{ select: [File] }>();

const input = useTemplateRef<HTMLInputElement>("input");
const preview = ref<string | null>(null);
const shown = computed(() => preview.value ?? props.src);

function onChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  preview.value = URL.createObjectURL(file);
  emit("select", file);
}

onBeforeUnmount(() => {
  if (preview.value) URL.revokeObjectURL(preview.value);
});
</script>

<template>
  <div class="flex items-start gap-3">
    <button
      type="button"
      class="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-default bg-elevated/40 text-muted transition-colors"
      :class="disabled ? 'cursor-not-allowed opacity-70' : 'hover:border-primary/60 hover:text-primary'"
      :disabled="disabled"
      :aria-label="alt"
      @click="input?.click()"
    >
      <img v-if="shown" :src="shown" :alt="alt" class="size-full object-cover">
      <UIcon v-else name="i-lucide-camera" class="size-6" />
    </button>

    <p v-if="hint" class="max-w-xs pt-1 text-xs text-muted">{{ hint }}</p>

    <input
      ref="input"
      type="file"
      accept="image/*"
      class="sr-only"
      :disabled="disabled"
      @change="onChange"
    >
  </div>
</template>
