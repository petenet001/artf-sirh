<script setup lang="ts">
import type { FormSubmitEvent, FormErrorEvent } from "@nuxt/ui";
import type { ZodType } from "zod";
import type { StepperStep } from "~/types/stepper";

/**
 * Formulaire multi-étapes réutilisable : un `UForm` unique + un stepper. Chaque
 * étape rend ses champs via un slot nommé (`#<step.key>`). Le passage à l'étape
 * suivante **valide d'abord les champs de l'étape** (`step.fields`) ; au submit
 * final, une erreur ramène automatiquement à l'étape fautive.
 *
 * Utilisation : voir `components/agents/Form.vue`. Convient à tout formulaire à
 * plusieurs sections (agent, dossier, etc.), en page ou en modale.
 */
const props = withDefaults(
  defineProps<{
    steps: StepperStep[];
    schema: ZodType<Record<string, unknown>>;
    state: Record<string, unknown>;
    submitting?: boolean;
    submitLabel?: string;
  }>(),
  { submitting: false, submitLabel: "Enregistrer" },
);

const emit = defineEmits<{
  submit: [FormSubmitEvent<Record<string, unknown>>];
  cancel: [];
}>();

const form = useTemplateRef<{
  validate: (opts?: { name?: string[]; silent?: boolean }) => Promise<unknown>;
}>("form");

const index = ref(0);
const isLast = computed(() => index.value === props.steps.length - 1);

function stateOf(i: number): "done" | "current" | "upcoming" {
  if (i < index.value) return "done";
  if (i === index.value) return "current";
  return "upcoming";
}

async function next() {
  const fields = props.steps[index.value]?.fields;
  if (fields?.length && form.value) {
    try {
      await form.value.validate({ name: fields });
    } catch {
      return; // erreurs affichées par UForm sur les champs concernés
    }
  }
  if (!isLast.value) index.value += 1;
}

function prev() {
  if (index.value > 0) index.value -= 1;
}

/** Retour possible sur une étape déjà franchie (clic sur son indicateur). */
function goTo(i: number) {
  if (i < index.value) index.value = i;
}

/** Erreur au submit → saute à la première étape contenant un champ fautif. */
function onError(e: FormErrorEvent) {
  const firstName = e.errors?.[0]?.name;
  if (!firstName) return;
  const i = props.steps.findIndex((s) => s.fields?.includes(firstName));
  if (i >= 0) index.value = i;
}
</script>

<template>
  <UForm
    ref="form"
    :schema="schema"
    :state="state"
    @submit="emit('submit', $event)"
    @error="onError"
  >
    <!-- Étapes en onglets soulignés (maquette) -->
    <ol class="mb-6 flex items-center gap-6 overflow-x-auto border-b border-default">
      <li v-for="(step, i) in steps" :key="step.key">
        <button
          type="button"
          class="relative flex items-center gap-2 whitespace-nowrap px-1 pb-3 text-sm font-medium transition-colors"
          :class="[
            i < index ? 'cursor-pointer' : 'cursor-default',
            stateOf(i) === 'upcoming' ? 'text-muted' : 'text-primary',
            i < index && 'hover:text-highlighted',
          ]"
          :aria-current="stateOf(i) === 'current' ? 'step' : undefined"
          @click="goTo(i)"
        >
          <UIcon v-if="step.icon" :name="step.icon" class="size-4 shrink-0" />
          {{ step.title }}
          <span
            v-if="stateOf(i) === 'current'"
            class="absolute inset-x-0 -bottom-px h-[3px] bg-primary"
          />
        </button>
      </li>
    </ol>

    <!--
      Contenu (toutes les étapes montées, seule l'active est visible).
      Deux colonnes : les champs à gauche (2/3 — ils ne s'étirent plus sur toute
      la largeur), l'illustration de l'étape à droite (1/3). La colonne d'image
      disparaît sous `lg` : sur mobile, seuls les champs comptent.
    -->
    <div v-for="(step, i) in steps" v-show="i === index" :key="step.key" class="grid gap-8 lg:grid-cols-3">
      <div :class="step.illustration || step.icon ? 'lg:col-span-2' : 'lg:col-span-3'">
        <slot :name="step.key" />
      </div>

      <aside v-if="step.illustration || step.icon" class="hidden lg:block">
        <div class="sticky top-24 overflow-hidden rounded-2xl border border-default bg-primary/[0.04] p-8 text-center">
          <img
            v-if="step.illustration"
            :src="step.illustration"
            :alt="step.title"
            class="mx-auto max-h-56 w-full object-contain"
          >
          <div v-else class="relative mx-auto grid size-40 place-items-center">
            <span class="absolute inset-0 rounded-full bg-primary/5" />
            <span class="absolute inset-6 rounded-full bg-primary/10" />
            <UIcon :name="step.icon ?? 'i-lucide-sparkles'" class="relative size-14 text-primary" />
          </div>

          <p class="mt-6 text-base font-semibold text-highlighted">{{ step.title }}</p>
          <p v-if="step.description" class="mt-1.5 text-sm text-muted">{{ step.description }}</p>
        </div>
      </aside>
    </div>

    <!-- Navigation : actions groupées en bas à droite (maquette) -->
    <div class="mt-8 flex items-center justify-end gap-2">
      <UButton
        v-if="index > 0"
        color="neutral"
        variant="outline"
        icon="i-lucide-arrow-left"
        @click="prev"
      >
        Précédent
      </UButton>
      <UButton color="neutral" variant="outline" @click="emit('cancel')">Annuler</UButton>
      <UButton v-if="!isLast" @click="next">Suivant</UButton>
      <UButton v-else type="submit" :loading="submitting">{{ submitLabel }}</UButton>
    </div>
  </UForm>
</template>
