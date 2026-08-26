<script setup lang="ts">
import type { Agent } from "~/schemas/agent";
import type { STRUCTURABLE_TYPES } from "~/constants/enums";
import { POSTES_NOMINATION, TYPES_ACTE_NOMINATION } from "~/schemas/nomination";

/**
 * Création d'une nomination unitaire (avec choix de l'agent). Née `en_attente`,
 * elle rejoint son circuit — on redirige vers son détail. Pour nommer plusieurs
 * agents d'un coup : voir « Nomination groupée ».
 */
const nominationsApi = useNominationsApi();
const toast = useToast();
const handleError = useApiError();

const { options: agentOptions } = useResourceOptions<Agent>(
  "opt-nom-new-agents",
  () => useAgentsApi().list(),
  (a) => a.nom_complet ?? `${a.prenom} ${a.nom}`,
);
const posteItems = POSTES_NOMINATION.map((p) => ({ label: p, value: p }));
const acteItems = TYPES_ACTE_NOMINATION.map((t) => ({ label: t, value: t }));

const agentId = ref<number | undefined>();
const poste = ref<(typeof POSTES_NOMINATION)[number] | undefined>();
const structurableType = ref<(typeof STRUCTURABLE_TYPES)[number]>("App\\Models\\Bureau");
const structurableId = ref<number | undefined>();
const date = ref("");
const typeActe = ref<(typeof TYPES_ACTE_NOMINATION)[number]>("decision");
const submitting = ref(false);

async function submit() {
  if (!agentId.value || !poste.value || !structurableId.value || !date.value) {
    toast.add({ title: "Agent, poste, structure et date requis.", color: "warning" });
    return;
  }
  submitting.value = true;
  try {
    const { data } = await nominationsApi.create({
      agent_id: agentId.value,
      poste: poste.value,
      structurable_type: structurableType.value,
      structurable_id: structurableId.value,
      date_debut: date.value,
      type_acte: typeActe.value || undefined,
    });
    toast.add({ title: "Nomination créée — circuit de validation initialisé", color: "success" });
    await navigateTo(`/carriere/nominations/${data.id}`);
  } catch (err) {
    handleError(err);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <BasePanel title="Nouvelle nomination" subtitle="Nommer un agent à un poste de responsabilité">
    <template #actions>
      <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" to="/carriere/nominations">
        Retour
      </UButton>
    </template>

    <div class="max-w-2xl space-y-4 rounded-xl border border-default bg-default p-5">
      <UFormField label="Agent" required>
        <USelectMenu v-model="agentId" value-key="value" :items="agentOptions" placeholder="Choisir un agent" class="w-full" />
      </UFormField>
      <UFormField label="Poste" required>
        <USelect v-model="poste" :items="posteItems" placeholder="Choisir un poste" class="w-full" />
      </UFormField>
      <UFormField label="Structure" required>
        <CarriereStructurePicker v-model:type="structurableType" v-model:id="structurableId" />
      </UFormField>
      <div class="grid gap-3 sm:grid-cols-2">
        <UFormField label="Date de début" required>
          <UInput v-model="date" type="date" class="w-full" />
        </UFormField>
        <UFormField label="Type d'acte">
          <USelect v-model="typeActe" :items="acteItems" class="w-full" />
        </UFormField>
      </div>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" variant="ghost" to="/carriere/nominations">Annuler</UButton>
        <UButton icon="i-lucide-check" :loading="submitting" @click="submit">Créer la nomination</UButton>
      </div>
    </div>
  </BasePanel>
</template>
