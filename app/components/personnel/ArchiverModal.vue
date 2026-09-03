<script setup lang="ts">
import { agentArchiverSchema } from "~/schemas/agent";

/**
 * Modale d'archivage d'un agent : motif obligatoire (min. 3 caractères).
 * L'archivage passe le statut à `archive` et **désactive le compte utilisateur** ;
 * les écritures sur le dossier sont ensuite refusées (422). Réversible via
 * « désarchiver » (repasse `inactif`).
 */
const props = defineProps<{ open: boolean; agentId: number }>();
const emit = defineEmits<{ "update:open": [boolean]; archived: [] }>();

const api = usePersonnelAgentsApi();
const toast = useToast();
const handleError = useApiError();

const open = computed({ get: () => props.open, set: (v) => emit("update:open", v) });
const submitting = ref(false);
const state = reactive<{ motif?: string }>({});

watch(open, (isOpen) => {
  if (isOpen) state.motif = undefined;
});

async function onSubmit() {
  submitting.value = true;
  try {
    await api.archiver(props.agentId, agentArchiverSchema.parse(state));
    toast.add({ title: "Agent archivé", color: "success" });
    open.value = false;
    emit("archived");
  } catch (err) {
    handleError(err);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Archiver l'agent">
    <template #title>
      <BaseCardTitle icon="i-lucide-archive" title="Archiver l'agent" />
    </template>
    <template #body>
      <UForm :schema="agentArchiverSchema" :state="state" class="space-y-4" @submit="onSubmit">
        <p class="text-sm text-muted">
          L'agent passera au statut <strong>archivé</strong> et son compte sera désactivé. Cette action est
          réversible (désarchivage).
        </p>
        <UFormField label="Motif de l'archivage" name="motif" required>
          <UTextarea v-model="state.motif" placeholder="Départ à la retraite, fin de contrat…" class="w-full" />
        </UFormField>
        <div class="flex justify-end gap-2 pt-2">
          <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
          <UButton type="submit" color="error" :loading="submitting">Archiver</UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
