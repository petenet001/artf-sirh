<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Affectation } from "~/schemas/affectation";
import { structurableLabel, agentNom } from "~/constants/carriere";

const { affectations, pending, error } = useAffectations();

const columns: TableColumn<Affectation>[] = [
  {
    id: "agent",
    header: "Agent",
    cell: ({ row }) => agentNom(row.original.agent),
  },
  {
    id: "structure",
    header: "Structure",
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
      <BaseTable :data="affectations" :columns="columns">
        <template #statut-cell="{ row }">
          <CarriereStatutBadge :statut="row!.original.statut" :label="row!.original.statut_label" />
        </template>
      </BaseTable>
    </BaseDataState>
  </BasePanel>
</template>
