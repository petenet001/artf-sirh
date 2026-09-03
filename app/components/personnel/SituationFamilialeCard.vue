<script setup lang="ts">
import { situationFamilialeInputSchema } from "~/schemas/situation-familiale";
import type { SituationFamiliale } from "~/schemas/situation-familiale";
import { STATUT_MATRIMONIAL_LABEL, STATUT_MATRIMONIAL_OPTIONS, type StatutMatrimonial } from "~/constants/personnel";

/** Bloc « Situation familiale » de la fiche agent : affichage + upsert. */
const props = defineProps<{
  agentId: number;
  situation?: SituationFamiliale | null;
  canEdit?: boolean;
}>();
const emit = defineEmits<{ changed: [] }>();

const api = usePersonnelAgentsApi();
const toast = useToast();
const handleError = useApiError();

const open = ref(false);
const submitting = ref(false);
const state = reactive<{ statut_matrimonial?: StatutMatrimonial; nb_enfants?: number }>({});

const statutLabel = computed(() =>
  props.situation?.statut_matrimonial
    ? STATUT_MATRIMONIAL_LABEL[props.situation.statut_matrimonial as StatutMatrimonial]
    : null,
);

function ouvrir() {
  state.statut_matrimonial = (props.situation?.statut_matrimonial as StatutMatrimonial) ?? undefined;
  state.nb_enfants = props.situation?.nb_enfants ?? undefined;
  open.value = true;
}

async function onSubmit() {
  submitting.value = true;
  try {
    await api.upsertSituationFamiliale(props.agentId, situationFamilialeInputSchema.parse(state));
    toast.add({ title: "Situation familiale mise à jour", color: "success" });
    open.value = false;
    emit("changed");
  } catch (err) {
    handleError(err);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="rounded-xl border border-default bg-default p-5">
    <div class="flex items-center justify-between">
      <BaseCardTitle icon="i-lucide-heart" title="Situation familiale" />
      <UButton v-if="canEdit" icon="i-lucide-pencil" color="neutral" variant="ghost" size="xs" @click="ouvrir">
        Modifier
      </UButton>
    </div>
    <dl class="mt-4 grid gap-x-10 gap-y-4 sm:grid-cols-2">
      <BaseDefItem label="Statut matrimonial" :value="statutLabel" />
      <BaseDefItem
        label="Nombre d'enfants"
        :value="situation?.nb_enfants != null ? String(situation.nb_enfants) : null"
      />
    </dl>

    <UModal v-model:open="open" title="Modifier la situation familiale">
      <template #title>
        <BaseCardTitle icon="i-lucide-heart" title="Modifier la situation familiale" />
      </template>
      <template #body>
        <UForm :schema="situationFamilialeInputSchema" :state="state" class="space-y-4" @submit="onSubmit">
          <UFormField label="Statut matrimonial" name="statut_matrimonial">
            <USelectMenu
              v-model="state.statut_matrimonial"
              value-key="value"
              :items="STATUT_MATRIMONIAL_OPTIONS"
              placeholder="Sélectionner"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Nombre d'enfants" name="nb_enfants">
            <UInputNumber v-model="state.nb_enfants" :min="0" :max="30" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-2 pt-2">
            <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
            <UButton type="submit" :loading="submitting">Enregistrer</UButton>
          </div>
        </UForm>
      </template>
    </UModal>
  </div>
</template>
