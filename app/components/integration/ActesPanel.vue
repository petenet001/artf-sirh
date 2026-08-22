<script setup lang="ts">
/** Onglet « Actes » : actes administratifs générés + signature. */
const props = defineProps<{ dossierId: number }>();

const actesApi = useActesAdministratifsApi();
const toast = useToast();
const handleError = useApiError();

const { data, pending, error, refresh } = useAsyncData(
  () => `actes-${props.dossierId}`,
  () => actesApi.byDossier(props.dossierId),
);
const actes = computed(() => data.value?.data ?? []);

async function signer(id: number) {
  try {
    await actesApi.signer(id);
    toast.add({ title: "Acte signé", color: "success" });
    await refresh();
  } catch (err) {
    handleError(err);
  }
}
</script>

<template>
  <BaseDataState :pending="pending" :error="error" :empty="!actes.length" empty-label="Aucun acte généré">
    <div class="space-y-2">
      <div
        v-for="acte in actes"
        :key="acte.id"
        class="flex items-center gap-3 rounded-lg border border-default bg-default p-3"
      >
        <UIcon name="i-lucide-stamp" class="size-5 shrink-0 text-muted" />
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-highlighted">
            {{ acte.type_acte_label ?? acte.type_acte }}
          </p>
          <p class="truncate text-xs text-muted">{{ acte.numero }}</p>
        </div>
        <UBadge :color="acte.signe ? 'success' : 'warning'" variant="subtle" size="sm">
          {{ acte.signe ? "Signé" : "Non signé" }}
        </UBadge>
        <UButton
          v-if="!acte.signe"
          icon="i-lucide-pen-line"
          size="xs"
          variant="soft"
          @click="signer(acte.id)"
        >
          Signer
        </UButton>
      </div>
    </div>
  </BaseDataState>
</template>
