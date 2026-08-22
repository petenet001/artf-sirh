<script setup lang="ts">
// Boîte de réception des validations : dossiers dont le circuit hiérarchique
// est en cours. L'API ne propose pas de liste globale des validations — on
// agrège les dossiers aux statuts de validation (filtrage serveur par statut).
const dossiersApi = useDossiersApi();

const { data, pending, error } = useAsyncData("dossiers-a-valider", async () => {
  const [valideRh, attenteDg] = await Promise.all([
    dossiersApi.list({ statut: "VALIDE_RH" }),
    dossiersApi.list({ statut: "EN_ATTENTE_DG" }),
  ]);
  return [...valideRh.data, ...attenteDg.data];
});
const dossiers = computed(() => data.value ?? []);
</script>

<template>
  <BasePanel title="Mes validations" subtitle="Dossiers en attente de validation hiérarchique">
    <BaseDataState :pending="pending" :error="error" :empty="!dossiers.length" empty-label="Aucun dossier à valider">
      <div class="space-y-2">
        <ULink
          v-for="d in dossiers"
          :key="d.id"
          :to="`/integration/dossiers/${d.id}`"
          class="flex items-center gap-3 rounded-lg border border-default bg-default p-3 transition-colors hover:bg-elevated/40"
        >
          <UIcon name="i-lucide-git-merge" class="size-5 shrink-0 text-primary" />
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-highlighted">{{ d.reference }}</p>
            <p class="truncate text-xs text-muted">
              {{ d.agent?.nom_complet ?? "Agent" }} · {{ d.type_integration?.nom }}
            </p>
          </div>
          <IntegrationStatutBadge :statut="d.statut" :label="d.statut_label" />
          <UIcon name="i-lucide-chevron-right" class="size-4 shrink-0 text-muted" />
        </ULink>
      </div>
    </BaseDataState>
  </BasePanel>
</template>
