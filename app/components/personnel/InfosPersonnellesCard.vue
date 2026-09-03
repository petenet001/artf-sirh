<script setup lang="ts">
import { informationsPersonnelleInputSchema } from "~/schemas/informations-personnelle";
import type { InformationsPersonnelle } from "~/schemas/informations-personnelle";

/**
 * Bloc « Coordonnées » de la fiche agent : affichage + édition (upsert PUT).
 * `infos` peut être `null` (jamais renseigné) → le formulaire part vierge.
 */
const props = defineProps<{
  agentId: number;
  infos?: InformationsPersonnelle | null;
  canEdit?: boolean;
}>();
const emit = defineEmits<{ changed: [] }>();

const api = usePersonnelAgentsApi();
const toast = useToast();
const handleError = useApiError();

const open = ref(false);
const submitting = ref(false);
const state = reactive<{ adresse?: string; quartier?: string; ville?: string; code_postal?: string; pays?: string }>({});

function ouvrir() {
  state.adresse = props.infos?.adresse ?? undefined;
  state.quartier = props.infos?.quartier ?? undefined;
  state.ville = props.infos?.ville ?? undefined;
  state.code_postal = props.infos?.code_postal ?? undefined;
  state.pays = props.infos?.pays ?? undefined;
  open.value = true;
}

async function onSubmit() {
  submitting.value = true;
  try {
    await api.upsertInfosPersonnelles(props.agentId, informationsPersonnelleInputSchema.parse(state));
    toast.add({ title: "Coordonnées mises à jour", color: "success" });
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
      <BaseCardTitle icon="i-lucide-map-pin" title="Coordonnées" />
      <UButton v-if="canEdit" icon="i-lucide-pencil" color="neutral" variant="ghost" size="xs" @click="ouvrir">
        Modifier
      </UButton>
    </div>
    <dl class="mt-4 grid gap-x-10 gap-y-4 sm:grid-cols-2">
      <BaseDefItem label="Adresse" :value="infos?.adresse" />
      <BaseDefItem label="Quartier" :value="infos?.quartier" />
      <BaseDefItem label="Ville" :value="infos?.ville" />
      <BaseDefItem label="Code postal" :value="infos?.code_postal" />
      <BaseDefItem label="Pays" :value="infos?.pays" />
    </dl>

    <UModal v-model:open="open" title="Modifier les coordonnées">
      <template #title>
        <BaseCardTitle icon="i-lucide-map-pin" title="Modifier les coordonnées" />
      </template>
      <template #body>
        <UForm :schema="informationsPersonnelleInputSchema" :state="state" class="space-y-4" @submit="onSubmit">
          <UFormField label="Adresse" name="adresse">
            <UTextarea v-model="state.adresse" class="w-full" />
          </UFormField>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Quartier" name="quartier">
              <UInput v-model="state.quartier" class="w-full" />
            </UFormField>
            <UFormField label="Ville" name="ville">
              <UInput v-model="state.ville" class="w-full" />
            </UFormField>
            <UFormField label="Code postal" name="code_postal">
              <UInput v-model="state.code_postal" class="w-full" />
            </UFormField>
            <UFormField label="Pays" name="pays">
              <UInput v-model="state.pays" class="w-full" />
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
