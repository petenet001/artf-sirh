<script setup lang="ts">
/** Provisionne le compte utilisateur de l'agent (login/email/badge auto). */
const open = defineModel<boolean>("open", { required: true });
const props = defineProps<{ dossierId: number; agentId: number }>();
const emit = defineEmits<{ done: [] }>();

const comptesApi = useComptesIntegrationApi();
const toast = useToast();
const handleError = useApiError();
const submitting = ref(false);

async function submit() {
  submitting.value = true;
  try {
    const { data } = await comptesApi.provisionner({
      agent_id: props.agentId,
      dossier_integration_id: props.dossierId,
    });
    toast.add({
      title: "Compte créé",
      description: data.login ? `Login : ${data.login} · ${data.email_professionnel ?? ""}` : undefined,
      color: "success",
      icon: "i-lucide-user-check",
    });
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
  <UModal v-model:open="open" title="Créer le compte utilisateur">
    <template #title>
      <BaseCardTitle icon="i-lucide-user-cog" title="Créer le compte utilisateur" />
    </template>
    <template #body>
      <div class="space-y-4">
        <p class="text-sm text-muted">
          Le système génère automatiquement le login, l'email professionnel, le badge
          et un mot de passe provisoire pour cet agent.
        </p>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
          <UButton icon="i-lucide-user-cog" :loading="submitting" @click="submit">Créer le compte</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
