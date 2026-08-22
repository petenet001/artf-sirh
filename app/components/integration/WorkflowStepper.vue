<script setup lang="ts">
import { INTEGRATION_PHASES, phaseOf, type DossierStatut } from "~/constants/integration-workflow";

/** Stepper vertical des 6 phases, état déduit du statut courant du dossier. */
const props = defineProps<{ statut: DossierStatut }>();

const currentIndex = computed(() => {
  const ph = phaseOf(props.statut);
  return ph ? INTEGRATION_PHASES.findIndex((p) => p.key === ph.key) : -1;
});
const isRejected = computed(() => ["REJETE", "ANNULE"].includes(props.statut));
const isDone = computed(() => props.statut === "INTEGRE");

function stateOf(i: number): "done" | "current" | "upcoming" {
  if (isDone.value) return "done";
  if (currentIndex.value < 0) return "upcoming";
  if (i < currentIndex.value) return "done";
  if (i === currentIndex.value) return "current";
  return "upcoming";
}
</script>

<template>
  <ol>
    <li v-for="(phase, i) in INTEGRATION_PHASES" :key="phase.key" class="flex gap-3">
      <div class="flex flex-col items-center">
        <span
          class="flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors"
          :class="{
            'border-primary bg-primary text-inverted': stateOf(i) === 'done',
            'border-primary text-primary': stateOf(i) === 'current' && !isRejected,
            'border-error text-error': stateOf(i) === 'current' && isRejected,
            'border-default text-dimmed': stateOf(i) === 'upcoming',
          }"
        >
          <UIcon :name="stateOf(i) === 'done' ? 'i-lucide-check' : phase.icon" class="size-4" />
        </span>
        <span
          v-if="i < INTEGRATION_PHASES.length - 1"
          class="my-1 w-px flex-1"
          :class="stateOf(i) === 'done' ? 'bg-primary' : 'bg-default'"
        />
      </div>
      <div class="pb-6 pt-1">
        <p class="text-sm font-medium" :class="stateOf(i) === 'upcoming' ? 'text-muted' : 'text-highlighted'">
          {{ phase.label }}
        </p>
        <p v-if="stateOf(i) === 'current'" class="mt-0.5 text-xs" :class="isRejected ? 'text-error' : 'text-primary'">
          {{ isRejected ? "Interrompu" : "En cours" }}
        </p>
      </div>
    </li>
  </ol>
</template>
