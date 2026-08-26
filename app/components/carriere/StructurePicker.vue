<script setup lang="ts">
import type { STRUCTURABLE_TYPES } from "~/constants/enums";

/**
 * Sélecteur de structure polymorphe (type + entité) pour les actes de carrière.
 * Deux `v-model` : `type` (`structurable_type`) et `id` (`structurable_id`).
 * Les listes de structures sont chargées une seule fois (clés de cache
 * partagées) et réutilisées par toutes les instances (lignes d'un lot).
 */
const type = defineModel<(typeof STRUCTURABLE_TYPES)[number]>("type", { required: true });
const id = defineModel<number | undefined>("id", { required: true });

const typeItems = [
  { label: "Direction", value: "App\\Models\\Direction" },
  { label: "Service", value: "App\\Models\\Service" },
  { label: "Bureau", value: "App\\Models\\Bureau" },
];

const { options: directionOptions } = useResourceOptions("opt-str-directions", () => useDirectionsApi().list());
const { options: serviceOptions } = useResourceOptions("opt-str-services", () => useServicesApi().list());
const { options: bureauOptions } = useResourceOptions("opt-str-bureaux", () => useBureauxApi().list());

const structureOptions = computed(() =>
  type.value === "App\\Models\\Direction"
    ? directionOptions.value
    : type.value === "App\\Models\\Service"
      ? serviceOptions.value
      : bureauOptions.value,
);

watch(type, () => {
  id.value = undefined;
});
</script>

<template>
  <div class="grid gap-2 sm:grid-cols-2">
    <USelect v-model="type" :items="typeItems" class="w-full" />
    <USelectMenu v-model="id" value-key="value" :items="structureOptions" placeholder="Structure" class="w-full" />
  </div>
</template>
