<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Affectation } from "~/schemas/affectation";
import { STATUTS_AFFECTATION } from "~/constants/enums";
import { structurableLabel, agentNom, STATUT_CARRIERE_LABEL } from "~/constants/carriere";

const { affectations, pending, error } = useAffectations();

// Filtre statut (client, sur la collection plate déjà reçue).
const ALL = "__all__";
const statutItems = [
  { label: "Tous les statuts", value: ALL },
  ...STATUTS_AFFECTATION.map((s) => ({ label: STATUT_CARRIERE_LABEL[s], value: s })),
];
const statut = ref<string>(ALL);
const rows = computed(() =>
  statut.value === ALL ? affectations.value : affectations.value.filter((a) => a.statut === statut.value),
);

const columns: TableColumn<Affectation>[] = [
  {
    id: "agent",
    header: "Agent",
    accessorFn: (a) => agentNom(a.agent),
    cell: ({ row }) => agentNom(row.original.agent),
  },
  {
    id: "structure",
    header: "Structure",
    accessorFn: (a) => structurableLabel(a.structurable_type),
    cell: ({ row }) => structurableLabel(row.original.structurable_type),
  },
  {
    id: "superieur",
    header: "Supérieur",
    cell: ({ row }) => row.original.superieur_hierarchique?.nom_complet ?? "—",
  },
  dateColumn<Affectation>("date_affectation", "Affectation"),
  { id: "statut", header: "Statut" },
];
</script>

<template>
  <BasePanel title="Affectations" subtitle="Rattachements des agents aux structures">
    <BaseDataState
      :pending="pending"
      :error="error"
      :empty="!affectations.length"
      empty-label="Aucune affectation"
    >
      <BaseTable
        :data="rows"
        :columns="columns"
        searchable
        search-placeholder="Rechercher un agent, une structure…"
        :page-size="10"
        :row-to="(a) => `/carriere/affectations/${a.id}`"
      >
        <template #filters>
          <USelect v-model="statut" :items="statutItems" class="w-48" />
        </template>
        <template #actions>
          <UButton icon="i-lucide-plus" to="/carriere/affectations/nouvelle">Nouvelle affectation</UButton>
          <UButton icon="i-lucide-users" variant="soft" to="/carriere/affectations/groupee">Groupée</UButton>
        </template>
        <template #statut-cell="{ row }">
          <CarriereStatutBadge :statut="row!.original.statut" :label="row!.original.statut_label" />
        </template>
      </BaseTable>
    </BaseDataState>
  </BasePanel>
</template>
