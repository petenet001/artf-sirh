<script setup lang="ts">
import type { Agent } from "~/schemas/agent";

/** Confirme la prise de service (présence, installation, équipements). */
const open = defineModel<boolean>("open", { required: true });
const props = defineProps<{ dossierId: number; agentId: number }>();
const emit = defineEmits<{ done: [] }>();

const prisesApi = usePrisesDeServiceApi();
const agentsApi = useAgentsApi();
const toast = useToast();
const handleError = useApiError();

const { options: agentOptions } = useResourceOptions<Agent>(
  "opt-agents-resp",
  () => agentsApi.list(),
  (a) => a.nom_complet ?? `${a.prenom} ${a.nom}`,
);

const responsableId = ref<number | undefined>();
const date = ref("");
const presence = ref(true);
const installation = ref(true);
const equipements = ref(true);
const observations = ref("");
const submitting = ref(false);

async function submit() {
  if (!responsableId.value || !date.value) {
    toast.add({ title: "Responsable et date requis", color: "warning" });
    return;
  }
  submitting.value = true;
  try {
    await prisesApi.create({
      agent_id: props.agentId,
      dossier_integration_id: props.dossierId,
      responsable_id: responsableId.value,
      date_prise_service: date.value,
      confirmation_presence: presence.value,
      confirmation_installation: installation.value,
      confirmation_equipements: equipements.value,
      observations: observations.value || undefined,
    });
    toast.add({ title: "Prise de service confirmée", color: "success" });
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
  <UModal v-model:open="open" title="Confirmer la prise de service">
    <template #title>
      <BaseCardTitle icon="i-lucide-clipboard-check" title="Confirmer la prise de service" />
    </template>
    <template #body>
      <div class="space-y-4">
        <UFormField label="Responsable hiérarchique" required>
          <USelect v-model="responsableId" :items="agentOptions" placeholder="Choisir un agent" class="w-full" />
        </UFormField>
        <UFormField label="Date de prise de service" required>
          <UInput v-model="date" type="date" class="w-full" />
        </UFormField>
        <div class="space-y-2">
          <USwitch v-model="presence" label="Présence confirmée" />
          <USwitch v-model="installation" label="Poste installé" />
          <USwitch v-model="equipements" label="Équipements remis" />
        </div>
        <UFormField label="Observations">
          <UTextarea v-model="observations" :rows="2" class="w-full" />
        </UFormField>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
          <UButton :loading="submitting" @click="submit">Confirmer</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
