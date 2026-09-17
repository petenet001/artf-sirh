<script setup lang="ts">
/**
 * Emplacement photo des formulaires d'identité, calé sur la maquette : carré
 * arrondi avec une icône d'appareil photo, qui affiche l'aperçu une fois une
 * image choisie. Le choix du fichier passe par `UFileUpload` (Nuxt UI), dont on
 * ne garde que le déclencheur (`open`) pour conserver le carré de la maquette.
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

const file = ref<File | null>(null);
const preview = ref<string | null>(null);
const shown = computed(() => preview.value ?? props.src);

function revoke() {
  if (preview.value) URL.revokeObjectURL(preview.value);
  preview.value = null;
}

watch(file, (value) => {
  if (!value) return;
  revoke();
  preview.value = URL.createObjectURL(value);
  emit("select", value);
});

onBeforeUnmount(revoke);
</script>

<template>
  <div class="flex items-start gap-3">
    <UFileUpload v-model="file" accept="image/*" :disabled="disabled" class="shrink-0">
      <template #default="{ open }">
        <button
          type="button"
          class="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-default bg-elevated/40 text-muted transition-colors"
          :class="disabled ? 'cursor-not-allowed opacity-70' : 'hover:border-primary/60 hover:text-primary'"
          :disabled="disabled"
          :aria-label="alt"
          @click="open()"
        >
          <img v-if="shown" :src="shown" :alt="alt" class="size-full object-cover">
          <UIcon v-else name="i-lucide-camera" class="size-6" />
        </button>
      </template>
    </UFileUpload>

    <p v-if="hint" class="max-w-xs pt-1 text-xs text-muted">{{ hint }}</p>
  </div>
</template>
