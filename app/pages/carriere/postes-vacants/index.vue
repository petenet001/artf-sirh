<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { PosteVacant } from "~/schemas/nomination";

const { postes, pending, error } = usePostesVacants();

const columns: TableColumn<PosteVacant>[] = [
  { accessorKey: "nom", header: "Structure", cell: ({ row }) => row.original.nom ?? "—" },
  { accessorKey: "type", header: "Type", cell: ({ row }) => row.original.type ?? "—" },
  {
    id: "postes",
    header: "Postes à pourvoir",
    cell: ({ row }) => row.original.postes_possibles.join(", "),
  },
];
</script>

<template>
  <BasePanel title="Postes vacants" subtitle="Structures sans responsable nommé">
    <BaseDataState
      :pending="pending"
      :error="error"
      :empty="!postes.length"
      empty-label="Aucun poste vacant"
    >
      <BaseTable :data="postes" :columns="columns" />
    </BaseDataState>
  </BasePanel>
</template>
