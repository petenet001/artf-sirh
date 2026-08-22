<script setup lang="ts">
import type { Agent } from "~/schemas/agent";
import type { STRUCTURABLE_TYPES } from "~/constants/enums";

/** Crée une affectation puis l'active (fait avancer le dossier vers AFFECTE). */
const open = defineModel<boolean>("open", { required: true });
const props = defineProps<{ dossierId: number; agentId: number }>();
const emit = defineEmits<{ done: [] }>();

const affectationsApi = useAffectationsApi();
const agentsApi = useAgentsApi();
const toast = useToast();
const handleError = useApiError();

const typeItems = [
  { label: "Direction", value: "App\\Models\\Direction" },
  { label: "Service", value: "App\\Models\\Service" },
  { label: "Bureau", value: "App\\Models\\Bureau" },
];

const { options: directionOptions } = useResourceOptions("opt-aff-directions", () => useDirectionsApi().list());
const { options: serviceOptions } = useResourceOptions("opt-aff-services", () => useServicesApi().list());
const { options: bureauOptions } = useResourceOptions("opt-aff-bureaux", () => useBureauxApi().list());
const { options: agentOptions } = useResourceOptions<Agent>(
  "opt-aff-superieurs",
  () => agentsApi.list(),
  (a) => a.nom_complet ?? `${a.prenom} ${a.nom}`,
);

const structurableType = ref<(typeof STRUCTURABLE_TYPES)[number]>("App\\Models\\Bureau");
const structurableId = ref<number | undefined>();
const date = ref("");
const motif = ref("");
const superieurId = ref<number | undefined>();
const submitting = ref(false);

const structureOptions = computed(() =>
  structurableType.value === "App\\Models\\Direction"
    ? directionOptions.value
    : structurableType.value === "App\\Models\\Service"
      ? serviceOptions.value
      : bureauOptions.value,
);

watch(structurableType, () => {
  structurableId.value = undefined;
});

async function submit() {
  if (!structurableId.value || !date.value) {
    toast.add({ title: "Structure et date d'affectation requises", color: "warning" });
    return;
  }
  submitting.value = true;
  try {
    const { data } = await affectationsApi.create({
      agent_id: props.agentId,
      structurable_type: structurableType.value,
      structurable_id: structurableId.value,
      date_affectation: date.value,
      motif: motif.value || undefined,
      superieur_hierarchique_id: superieurId.value ?? undefined,
    });
    await affectationsApi.activer(data.id, { dossier_integration_id: props.dossierId });
    toast.add({ title: "Agent affecté", color: "success" });
    open.value = false;
    emit("done");
  } catch (err) {
    handleError(err);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Affecter l'agent">
    <template #title>
      <BaseCardTitle icon="i-lucide-building-2" title="Affecter l'agent" />
    </template>
    <template #body>
      <div class="space-y-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <UFormField label="Type de structure" required>
            <USelect v-model="structurableType" :items="typeItems" class="w-full" />
          </UFormField>
          <UFormField label="Structure" required>
            <USelect v-model="structurableId" :items="structureOptions" placeholder="Choisir" class="w-full" />
          </UFormField>
        </div>
        <UFormField label="Date d'affectation" required>
          <UInput v-model="date" type="date" class="w-full" />
        </UFormField>
        <UFormField label="Supérieur hiérarchique">
          <USelect v-model="superieurId" :items="agentOptions" placeholder="Optionnel" class="w-full" />
        </UFormField>
        <UFormField label="Motif">
          <UTextarea v-model="motif" :rows="2" class="w-full" />
        </UFormField>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
          <UButton :loading="submitting" @click="submit">Affecter & activer</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
