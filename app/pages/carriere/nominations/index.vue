<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Nomination } from "~/schemas/nomination";
import { structurableLabel, agentNom } from "~/constants/carriere";

const { nominations, pending, error } = useNominations();

const columns: TableColumn<Nomination>[] = [
  {
    id: "agent",
    header: "Agent",
    cell: ({ row }) => agentNom(row.original.agent),
  },
  { accessorKey: "poste", header: "Poste", cell: ({ row }) => row.original.poste ?? "—" },
  {
    id: "structure",
    header: "Structure",
    cell: ({ row }) => row.original.structure?.nom ?? structurableLabel(row.original.structurable_type),
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
      <BaseTable :data="nominations" :columns="columns">
        <template #statut-cell="{ row }">
          <CarriereStatutBadge :statut="row!.original.statut" :label="row!.original.statut_label" />
        </template>
      </BaseTable>
    </BaseDataState>
  </BasePanel>
</template>
