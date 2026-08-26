<script setup lang="ts">
import type { Agent } from "~/schemas/agent";
import type { STRUCTURABLE_TYPES } from "~/constants/enums";

/**
 * Création d'une affectation unitaire (avec choix de l'agent). Née
 * `en_attente_validation`, elle rejoint son circuit — on redirige vers son
 * détail. Pour affecter plusieurs agents d'un coup : voir « Affectation groupée ».
 */
const affectationsApi = useAffectationsApi();
const toast = useToast();
const handleError = useApiError();

const { options: agentOptions } = useResourceOptions<Agent>(
  "opt-aff-new-agents",
  () => useAgentsApi().list(),
  (a) => a.nom_complet ?? `${a.prenom} ${a.nom}`,
);

const agentId = ref<number | undefined>();
const structurableType = ref<(typeof STRUCTURABLE_TYPES)[number]>("App\\Models\\Bureau");
const structurableId = ref<number | undefined>();
const date = ref("");
const motif = ref("");
const superieurId = ref<number | undefined>();
const submitting = ref(false);

async function submit() {
  if (!agentId.value || !structurableId.value || !date.value) {
    toast.add({ title: "Agent, structure et date d'affectation requis.", color: "warning" });
    return;
  }
  submitting.value = true;
  try {
    const { data } = await affectationsApi.create({
      agent_id: agentId.value,
      structurable_type: structurableType.value,
      structurable_id: structurableId.value,
      date_affectation: date.value,
      motif: motif.value || undefined,
      superieur_hierarchique_id: superieurId.value ?? undefined,
    });
    toast.add({ title: "Affectation créée — circuit de validation initialisé", color: "success" });
    await navigateTo(`/carriere/affectations/${data.id}`);
  } catch (err) {
    handleError(err);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <BasePanel title="Nouvelle affectation" subtitle="Rattacher un agent à une structure">
    <template #actions>
      <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" to="/carriere/affectations">
        Retour
      </UButton>
    </template>

    <div class="max-w-2xl space-y-4 rounded-xl border border-default bg-default p-5">
      <UFormField label="Agent" required>
        <USelectMenu v-model="agentId" value-key="value" :items="agentOptions" placeholder="Choisir un agent" class="w-full" />
      </UFormField>
      <UFormField label="Structure" required>
        <CarriereStructurePicker v-model:type="structurableType" v-model:id="structurableId" />
      </UFormField>
      <div class="grid gap-3 sm:grid-cols-2">
        <UFormField label="Date d'affectation" required>
          <UInput v-model="date" type="date" class="w-full" />
        </UFormField>
        <UFormField label="Supérieur hiérarchique">
          <USelectMenu v-model="superieurId" value-key="value" :items="agentOptions" placeholder="Auto si vide" class="w-full" />
        </UFormField>
      </div>
      <UFormField label="Motif">
        <UTextarea v-model="motif" :rows="2" class="w-full" />
      </UFormField>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" variant="ghost" to="/carriere/affectations">Annuler</UButton>
        <UButton icon="i-lucide-check" :loading="submitting" @click="submit">Créer l'affectation</UButton>
      </div>
    </div>
  </BasePanel>
</template>
