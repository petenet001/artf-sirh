<script setup lang="ts">
import type { STRUCTURABLE_TYPES } from "~/constants/enums";
import { POSTES_NOMINATION, TYPES_ACTE_NOMINATION } from "~/schemas/nomination";

/**
 * Crée une nomination (statut `en_attente`) et redirige vers son détail
 * carrière. L'activation n'est plus immédiate : la nomination doit d'abord
 * parcourir son circuit de validation (cf. page détail).
 */
const open = defineModel<boolean>("open", { required: true });
const props = defineProps<{ dossierId: number; agentId: number }>();
const emit = defineEmits<{ done: [] }>();

const nominationsApi = useNominationsApi();
const toast = useToast();
const handleError = useApiError();

const typeItems = [
  { label: "Direction", value: "App\\Models\\Direction" },
  { label: "Service", value: "App\\Models\\Service" },
  { label: "Bureau", value: "App\\Models\\Bureau" },
];
const posteItems: { label: string; value: string }[] = POSTES_NOMINATION.map((p) => ({ label: p, value: p }));
const acteItems: { label: string; value: string }[] = TYPES_ACTE_NOMINATION.map((t) => ({ label: t, value: t }));

const { options: directionOptions } = useResourceOptions("opt-nom-directions", () => useDirectionsApi().list());
const { options: serviceOptions } = useResourceOptions("opt-nom-services", () => useServicesApi().list());
const { options: bureauOptions } = useResourceOptions("opt-nom-bureaux", () => useBureauxApi().list());

const poste = ref<string | undefined>();
const structurableType = ref<(typeof STRUCTURABLE_TYPES)[number]>("App\\Models\\Bureau");
const structurableId = ref<number | undefined>();
const date = ref("");
const typeActe = ref<string | undefined>("decision");
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
  if (!poste.value || !structurableId.value || !date.value) {
    toast.add({ title: "Poste, structure et date requis", color: "warning" });
    return;
  }
  submitting.value = true;
  try {
    const { data } = await nominationsApi.create({
      agent_id: props.agentId,
      poste: poste.value as (typeof POSTES_NOMINATION)[number],
      structurable_type: structurableType.value,
      structurable_id: structurableId.value,
      date_debut: date.value,
      type_acte: (typeActe.value as (typeof TYPES_ACTE_NOMINATION)[number]) || undefined,
    });
    toast.add({ title: "Nomination créée — circuit de validation initialisé", color: "success" });
    open.value = false;
    emit("done");
    await navigateTo(`/carriere/nominations/${data.id}`);
  } catch (err) {
    handleError(err);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Nommer l'agent">
    <template #title>
      <BaseCardTitle icon="i-lucide-award" title="Nommer l'agent" />
    </template>
    <template #body>
      <div class="space-y-4">
        <UFormField label="Poste" required>
          <USelect v-model="poste" :items="posteItems" placeholder="Choisir un poste" class="w-full" />
        </UFormField>
        <div class="grid gap-3 sm:grid-cols-2">
          <UFormField label="Type de structure" required>
            <USelect v-model="structurableType" :items="typeItems" class="w-full" />
          </UFormField>
          <UFormField label="Structure" required>
            <USelect v-model="structurableId" :items="structureOptions" placeholder="Choisir" class="w-full" />
          </UFormField>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <UFormField label="Date de début" required>
            <UInput v-model="date" type="date" class="w-full" />
          </UFormField>
          <UFormField label="Type d'acte">
            <USelect v-model="typeActe" :items="acteItems" class="w-full" />
          </UFormField>
        </div>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
          <UButton :loading="submitting" @click="submit">Créer la nomination</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
