<script setup lang="ts">
/** Assigne le matricule (fourni par le système externe). */
const open = defineModel<boolean>("open", { required: true });
const props = defineProps<{ dossierId: number }>();
const emit = defineEmits<{ done: [] }>();

const dossiersApi = useDossiersApi();
const toast = useToast();
const handleError = useApiError();

const matricule = ref("");
const submitting = ref(false);

async function submit() {
  if (!matricule.value.trim()) {
    toast.add({ title: "Saisissez un matricule", color: "warning" });
    return;
  }
  submitting.value = true;
  try {
    await dossiersApi.assignerMatricule(props.dossierId, { matricule: matricule.value.trim() });
    toast.add({ title: `Matricule ${matricule.value.trim()} assigné`, color: "success" });
    open.value = false;
    matricule.value = "";
    emit("done");
  } catch (err) {
    handleError(err);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Assigner le matricule">
    <template #title>
      <BaseCardTitle icon="i-lucide-hash" title="Assigner le matricule" />
    </template>
    <template #body>
      <div class="space-y-4">
        <UFormField label="Matricule" help="Fourni par le système externe — doit être unique." required>
          <UInput v-model="matricule" placeholder="ARTF-2026-000042" class="w-full" />
        </UFormField>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
          <UButton :loading="submitting" @click="submit">Assigner</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
