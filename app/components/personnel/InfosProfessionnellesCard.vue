<script setup lang="ts">
import { informationsProfessionnelleInputSchema } from "~/schemas/informations-professionnelle";
import type { InformationsProfessionnelle } from "~/schemas/informations-professionnelle";

/** Bloc « Profil professionnel » de la fiche agent : affichage + upsert. */
const props = defineProps<{
  agentId: number;
  infos?: InformationsProfessionnelle | null;
  canEdit?: boolean;
}>();
const emit = defineEmits<{ changed: [] }>();

const api = usePersonnelAgentsApi();
const diplomesApi = useDiplomesApi();
const toast = useToast();
const handleError = useApiError();

const { options: diplomeOptions } = useResourceOptions("fiche-diplomes", () => diplomesApi.list());

const open = ref(false);
const submitting = ref(false);
const state = reactive<{
  diplome_id?: number;
  niveau_etude?: string;
  specialite?: string;
  annees_experience?: number;
  etablissement?: string;
}>({});

function ouvrir() {
  state.diplome_id = props.infos?.diplome_id ?? props.infos?.diplome?.id ?? undefined;
  state.niveau_etude = props.infos?.niveau_etude ?? undefined;
  state.specialite = props.infos?.specialite ?? undefined;
  state.annees_experience = props.infos?.annees_experience ?? undefined;
  state.etablissement = props.infos?.etablissement ?? undefined;
  open.value = true;
}

async function onSubmit() {
  submitting.value = true;
  try {
    await api.upsertInfosProfessionnelles(props.agentId, informationsProfessionnelleInputSchema.parse(state));
    toast.add({ title: "Profil professionnel mis à jour", color: "success" });
    open.value = false;
    emit("changed");
  } catch (err) {
    handleError(err);
  } finally {
    submitting.value = false;
  }
}

const experienceLabel = computed(() =>
  props.infos?.annees_experience != null ? `${props.infos.annees_experience} an(s)` : null,
);
</script>

<template>
  <div class="rounded-xl border border-default bg-default p-5">
    <div class="flex items-center justify-between">
      <BaseCardTitle icon="i-lucide-graduation-cap" title="Profil professionnel" />
      <UButton v-if="canEdit" icon="i-lucide-pencil" color="neutral" variant="ghost" size="xs" @click="ouvrir">
        Modifier
      </UButton>
    </div>
    <dl class="mt-4 grid gap-x-10 gap-y-4 sm:grid-cols-2">
      <BaseDefItem label="Diplôme" :value="infos?.diplome?.nom" />
      <BaseDefItem label="Niveau d'étude" :value="infos?.niveau_etude" />
      <BaseDefItem label="Spécialité" :value="infos?.specialite" />
      <BaseDefItem label="Années d'expérience" :value="experienceLabel" />
      <BaseDefItem label="Établissement" :value="infos?.etablissement" />
    </dl>

    <UModal v-model:open="open" title="Modifier le profil professionnel">
      <template #title>
        <BaseCardTitle icon="i-lucide-graduation-cap" title="Modifier le profil professionnel" />
      </template>
      <template #body>
        <UForm :schema="informationsProfessionnelleInputSchema" :state="state" class="space-y-4" @submit="onSubmit">
          <UFormField label="Diplôme" name="diplome_id">
            <USelectMenu
              v-model="state.diplome_id"
              value-key="value"
              :items="diplomeOptions"
              placeholder="Sélectionner un diplôme"
              class="w-full"
            />
          </UFormField>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Niveau d'étude" name="niveau_etude">
              <UInput v-model="state.niveau_etude" class="w-full" />
            </UFormField>
            <UFormField label="Spécialité" name="specialite">
              <UInput v-model="state.specialite" class="w-full" />
            </UFormField>
            <UFormField label="Années d'expérience" name="annees_experience">
              <UInputNumber v-model="state.annees_experience" :min="0" :max="70" class="w-full" />
            </UFormField>
            <UFormField label="Établissement" name="etablissement">
              <UInput v-model="state.etablissement" class="w-full" />
            </UFormField>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
            <UButton type="submit" :loading="submitting">Enregistrer</UButton>
          </div>
        </UForm>
      </template>
    </UModal>
  </div>
</template>
