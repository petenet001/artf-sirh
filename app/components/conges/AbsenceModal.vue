<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import { absenceInputSchema, type AbsenceInput } from "~/schemas/absence";
import type { TypeAbsence } from "~/schemas/type-absence";
import { agentNom } from "~/constants/conges";

/**
 * Modale de déclaration d'une absence. Le type sélectionné pilote le motif :
 * obligatoire si `justification_requise`. Circuit unique côté API (validation
 * simple ensuite).
 */
const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ "update:open": [boolean]; created: [] }>();

const auth = useAuthStore();
const toast = useToast();
const handleError = useApiError();
const absencesApi = useAbsencesApi();
const typesApi = useTypesAbsencesApi();
const agentsApi = useAgentsApi();

const open = computed({ get: () => props.open, set: (v) => emit("update:open", v) });

const { data: typesData } = useAsyncData("absence-types-select", () => typesApi.list());
const types = computed(() => typesData.value?.data ?? []);
const typeOptions = computed(() => types.value.map((t) => ({ label: t.nom, value: t.id })));

const { data: agentsData } = useAsyncData("absence-agents-select", () => agentsApi.list());
const agentOptions = computed(() =>
  (agentsData.value?.data ?? []).map((a) => ({ label: agentNom(a), value: a.id })),
);

/** État du formulaire (sans `null` : les contrôles n'acceptent que `string | undefined`). */
interface AbsenceForm {
  agent_id?: number;
  type_absence_id?: number;
  date_debut?: string;
  date_fin?: string;
  justifiee?: boolean;
  motif?: string;
}
const state = reactive<AbsenceForm>({});
const submitting = ref(false);

const selectedType = computed<TypeAbsence | undefined>(() =>
  types.value.find((t) => t.id === state.type_absence_id),
);
const motifRequis = computed(() => !!selectedType.value?.justification_requise);

function reset() {
  state.agent_id = auth.user?.agent_id ?? undefined;
  state.type_absence_id = undefined;
  state.date_debut = undefined;
  state.date_fin = undefined;
  state.justifiee = false;
  state.motif = undefined;
}

watch(open, (isOpen) => {
  if (isOpen) reset();
});

async function onSubmit(event: FormSubmitEvent<AbsenceInput>) {
  if (motifRequis.value && !event.data.motif?.trim()) {
    toast.add({ title: "Un motif est requis pour ce type d'absence.", color: "error" });
    return;
  }
  submitting.value = true;
  try {
    await absencesApi.create(event.data);
    toast.add({ title: "Absence déclarée", color: "success" });
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
  <UModal v-model:open="open" title="Déclarer une absence">
    <template #title>
      <BaseCardTitle icon="i-lucide-user-x" title="Déclarer une absence" />
    </template>
    <template #body>
      <UForm :schema="absenceInputSchema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Agent" name="agent_id">
          <USelectMenu v-model="state.agent_id" value-key="value" :items="agentOptions" placeholder="Sélectionner un agent" class="w-full" />
        </UFormField>

        <UFormField label="Type d'absence" name="type_absence_id">
          <USelectMenu v-model="state.type_absence_id" value-key="value" :items="typeOptions" placeholder="Sélectionner un type" class="w-full" />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Du" name="date_debut">
            <UInput v-model="state.date_debut" type="date" class="w-full" />
          </UFormField>
          <UFormField label="Au" name="date_fin">
            <UInput v-model="state.date_fin" type="date" class="w-full" />
          </UFormField>
        </div>

        <UFormField
          label="Motif"
          name="motif"
          :help="motifRequis ? 'Obligatoire pour ce type d\'absence.' : undefined"
        >
          <UTextarea v-model="state.motif" :placeholder="motifRequis ? 'Requis' : 'Optionnel'" class="w-full" />
        </UFormField>

        <UFormField name="justifiee">
          <USwitch v-model="state.justifiee" label="Absence justifiée" />
        </UFormField>

        <div class="flex justify-end gap-2 pt-2">
          <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
          <UButton type="submit" :loading="submitting">Déclarer</UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
