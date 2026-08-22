<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { ListParams } from "~/types/api";
import type { DossierIntegration } from "~/schemas/dossier-integration";
import { STATUTS_DOSSIER } from "~/constants/enums";
import { STATUT_META } from "~/constants/integration-workflow";

const dossiersApi = useDossiersApi();
const filters = reactive<ListParams>({});

const { data, pending, error } = useAsyncData(
  "dossiers-list",
  () => dossiersApi.list({ ...filters }),
  { watch: [filters] },
);
const dossiers = computed(() => data.value?.data ?? []);

// Reka UI interdit une option à valeur chaîne vide → on utilise une sentinelle
// « tous » mappée vers « aucun filtre ».
const ALL = "__all__";
const statutItems = [
  { label: "Tous les statuts", value: ALL },
  ...STATUTS_DOSSIER.map((s) => ({ label: STATUT_META[s].label, value: s })),
];
const statut = computed<string>({
  get: () => (filters.statut as string) || ALL,
  set: (v) => {
    filters.statut = v === ALL ? undefined : v;
  },
});

const columns: TableColumn<DossierIntegration>[] = [
  //{ accessorKey: "reference", header: sortableHeader("Référence") },
   { accessorKey: "reference", header: "Référence du dossier"},
  { id: "agent", header: "Agent", cell: ({ row }) => row.original.agent?.nom_complet ?? "—" },
  { id: "type", header: "Type", cell: ({ row }) => row.original.type_integration?.nom ?? "—" },
  { id: "statut", header: "Statut" },
  dateColumn<DossierIntegration>("date_demande", "Demande"),
];
</script>

<template>
  <BasePanel title="Dossiers d'intégration" subtitle="Suivi des intégrations administratives">
    <template #actions>
      <UButton icon="i-lucide-plus" to="/integration/nouveau">Nouvelle intégration</UButton>
    </template>

    <div class="mb-4 max-w-xs">
      <USelect v-model="statut" :items="statutItems" placeholder="Filtrer par statut" class="w-full" />
    </div>

    <BaseDataState :pending="pending" :error="error" :empty="!dossiers.length" empty-label="Aucun dossier">
      <BaseTable :data="dossiers" :columns="columns" :row-to="(d) => `/integration/dossiers/${d.id}`">
        <template #statut-cell="{ row }">
          <IntegrationStatutBadge :statut="row!.original.statut" :label="row!.original.statut_label" />
        </template>
        <template #reference-cell="{ row }">
          <span class="font-medium text-primary">{{ row!.original.reference }}</span>
        </template>
      </BaseTable>
    </BaseDataState>
  </BasePanel>
</template>
