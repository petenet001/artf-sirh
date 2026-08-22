<script setup lang="ts">
/** Enregistre une remise de matériel (un équipement par ligne). */
const open = defineModel<boolean>("open", { required: true });
const props = defineProps<{ agentId: number }>();
const emit = defineEmits<{ done: [] }>();

const remisesApi = useRemisesMaterielApi();
const toast = useToast();
const handleError = useApiError();

const date = ref("");
const materielText = ref("");
const submitting = ref(false);

async function submit() {
  const materiel = materielText.value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (!date.value || !materiel.length) {
    toast.add({ title: "Date et au moins un équipement requis", color: "warning" });
    return;
  }
  submitting.value = true;
  try {
    await remisesApi.create({ agent_id: props.agentId, date_remise: date.value, materiel });
    toast.add({ title: "Remise de matériel enregistrée", color: "success" });
    open.value = false;
    materielText.value = "";
    emit("done");
  } catch (err) {
    handleError(err);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Remettre du matériel">
    <template #title>
      <BaseCardTitle icon="i-lucide-package" title="Remettre du matériel" />
    </template>
    <template #body>
      <div class="space-y-4">
        <UFormField label="Date de remise" required>
          <UInput v-model="date" type="date" class="w-full" />
        </UFormField>
        <UFormField label="Équipements" help="Un équipement par ligne." required>
          <UTextarea v-model="materielText" :rows="4" class="w-full" placeholder="Ordinateur portable Dell&#10;Téléphone professionnel&#10;Badge d'accès" />
        </UFormField>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
          <UButton :loading="submitting" @click="submit">Enregistrer</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
