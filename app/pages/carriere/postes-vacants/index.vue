<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { PosteVacant } from "~/schemas/nomination";

const { postes, pending, error } = usePostesVacants();

// Filtre par type de structure (client, sur la collection plate).
const ALL = "__all__";
const typeItems = [
  { label: "Tous les types", value: ALL },
  { label: "Direction", value: "Direction" },
  { label: "Service", value: "Service" },
  { label: "Bureau", value: "Bureau" },
];
const type = ref<string>(ALL);
const rows = computed(() =>
  type.value === ALL ? postes.value : postes.value.filter((p) => p.type === type.value),
);

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
      <BaseTable
        :data="rows"
        :columns="columns"
        searchable
        search-placeholder="Rechercher une structure…"
        :page-size="10"
      >
        <template #filters>
          <USelect v-model="type" :items="typeItems" class="w-48" />
        </template>
      </BaseTable>
    </BaseDataState>
  </BasePanel>
</template>
