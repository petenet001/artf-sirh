<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Nomination } from "~/schemas/nomination";
import { STATUTS_NOMINATION } from "~/constants/enums";
import { structurableLabel, agentNom, STATUT_CARRIERE_LABEL } from "~/constants/carriere";

const { nominations, pending, error } = useNominations();

const ALL = "__all__";
const statutItems = [
  { label: "Tous les statuts", value: ALL },
  ...STATUTS_NOMINATION.map((s) => ({ label: STATUT_CARRIERE_LABEL[s], value: s })),
];
const statut = ref<string>(ALL);
const rows = computed(() =>
  statut.value === ALL ? nominations.value : nominations.value.filter((n) => n.statut === statut.value),
);

const structureNom = (n: Nomination) => n.structure?.nom ?? structurableLabel(n.structurable_type);

const columns: TableColumn<Nomination>[] = [
  {
    id: "agent",
    header: "Agent",
    accessorFn: (n) => agentNom(n.agent),
    cell: ({ row }) => agentNom(row.original.agent),
  },
  {
    accessorKey: "poste",
    header: "Poste",
    cell: ({ row }) => row.original.poste ?? "—",
  },
  {
    id: "structure",
    header: "Structure",
    accessorFn: (n) => structureNom(n),
    cell: ({ row }) => structureNom(row.original),
  },
  dateColumn<Nomination>("date_debut", "Prise d'effet"),
  { id: "statut", header: "Statut" },
];
</script>

<template>
  <BasePanel title="Nominations" subtitle="Nominations des agents aux postes de responsabilité">
    <BaseDataState
      :pending="pending"
      :error="error"
      :empty="!nominations.length"
      empty-label="Aucune nomination"
    >
      <BaseTable
        :data="rows"
        :columns="columns"
        searchable
        search-placeholder="Rechercher un agent, un poste, une structure…"
        :page-size="10"
        :row-to="(n) => `/carriere/nominations/${n.id}`"
      >
        <template #filters>
          <USelect v-model="statut" :items="statutItems" class="w-48" />
        </template>
        <template #actions>
          <UButton icon="i-lucide-plus" to="/carriere/nominations/nouvelle">Nouvelle nomination</UButton>
          <UButton icon="i-lucide-users" variant="soft" to="/carriere/nominations/groupee">Groupée</UButton>
        </template>
        <template #statut-cell="{ row }">
          <CarriereStatutBadge :statut="row!.original.statut" :label="row!.original.statut_label" />
        </template>
      </BaseTable>
    </BaseDataState>
  </BasePanel>
</template>
