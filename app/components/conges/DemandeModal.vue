<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import { demandeCongeInputSchema, type DemandeCongeInput } from "~/schemas/demande-conge";
import type { TypeConge } from "~/schemas/type-conge";
import { agentNom } from "~/constants/conges";

/**
 * Modale de soumission d'une demande de congé. Le type sélectionné pilote le
 * formulaire : un justificatif devient obligatoire si `justificatif_requis`
 * (envoi alors en multipart, géré par le repository). L'agent est préréglé sur
 * le compte connecté ; la RH peut choisir un autre agent.
 */
const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ "update:open": [boolean]; created: [] }>();

const auth = useAuthStore();
const toast = useToast();
const handleError = useApiError();
const demandesApi = useDemandesCongeApi();
const typesApi = useTypesCongesApi();
const agentsApi = useAgentsApi();

const open = computed({ get: () => props.open, set: (v) => emit("update:open", v) });

const { data: typesData } = useAsyncData("conge-types-select", () => typesApi.list());
const types = computed(() => typesData.value?.data ?? []);
const typeOptions = computed(() => types.value.map((t) => ({ label: t.nom, value: t.id })));

const { data: agentsData } = useAsyncData("conge-agents-select", () => agentsApi.list());
const agentOptions = computed(() =>
  (agentsData.value?.data ?? []).map((a) => ({ label: agentNom(a), value: a.id })),
);

/** État du formulaire (sans `null` : les contrôles n'acceptent que `string | undefined`). */
interface DemandeForm {
  agent_id?: number;
  type_conge_id?: number;
  date_debut?: string;
  date_fin?: string;
  motif?: string;
}
const state = reactive<DemandeForm>({});
const justificatif = ref<File | null>(null);
const submitting = ref(false);

const selectedType = computed<TypeConge | undefined>(() =>
  types.value.find((t) => t.id === state.type_conge_id),
);
const justificatifRequis = computed(() => !!selectedType.value?.justificatif_requis);

function reset() {
  state.agent_id = auth.user?.agent_id ?? undefined;
  state.type_conge_id = undefined;
  state.date_debut = undefined;
  state.date_fin = undefined;
  state.motif = undefined;
  justificatif.value = null;
}

watch(open, (isOpen) => {
  if (isOpen) reset();
});

async function onSubmit(event: FormSubmitEvent<DemandeCongeInput>) {
  if (justificatifRequis.value && !justificatif.value) {
    toast.add({ title: "Un justificatif est requis pour ce type de congé.", color: "error" });
    return;
  }
  submitting.value = true;
  try {
    await demandesApi.create(event.data, justificatif.value);
    toast.add({ title: "Demande soumise", color: "success" });
    emit("created");
    open.value = false;
  } catch (err) {
    handleError(err);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Nouvelle demande de congé">
    <template #title>
      <BaseCardTitle icon="i-lucide-file-plus" title="Nouvelle demande de congé" />
    </template>
    <template #body>
      <UForm :schema="demandeCongeInputSchema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Agent" name="agent_id">
          <USelectMenu
            v-model="state.agent_id"
            value-key="value"
            :items="agentOptions"
            placeholder="Sélectionner un agent"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Type de congé" name="type_conge_id">
          <USelectMenu
            v-model="state.type_conge_id"
            value-key="value"
            :items="typeOptions"
            placeholder="Sélectionner un type"
            class="w-full"
          />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Du" name="date_debut">
            <UInput v-model="state.date_debut" type="date" class="w-full" />
          </UFormField>
          <UFormField label="Au" name="date_fin">
            <UInput v-model="state.date_fin" type="date" class="w-full" />
          </UFormField>
        </div>

        <UFormField label="Motif" name="motif" :help="selectedType?.debite_solde ? 'Ce congé est décompté du solde.' : undefined">
          <UTextarea v-model="state.motif" placeholder="Optionnel" class="w-full" />
        </UFormField>

        <BaseUploadZone
          v-if="justificatifRequis"
          label="Justificatif (obligatoire)"
          accept="PDF, JPEG, PNG (max 10 Mo)"
          accept-attr="application/pdf,image/*"
          :file-name="justificatif?.name"
          @select="justificatif = $event"
        />

        <div class="flex justify-end gap-2 pt-2">
          <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
          <UButton type="submit" :loading="submitting">Soumettre</UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
