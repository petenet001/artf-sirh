<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { CrudField } from "~/types/crud";
import { motifAdministratifInputSchema, type MotifAdministratif } from "~/schemas/motif-administratif";

const repo = useMotifsAdministratifsApi();

const columns: TableColumn<MotifAdministratif>[] = [
  { accessorKey: "nom", header: "Nom" },
  { accessorKey: "description", header: "Description" },
];

const fields: CrudField[] = [
  { name: "nom", label: "Nom" },
  { name: "description", label: "Description", type: "textarea" },
];
</script>

<template>
  <BaseCrudManager
    cache-key="motifs-administratifs"
    title="Motifs administratifs"
    subtitle="Référentiel RH"
    entity-label="Motif administratif"
    searchable
    :repo="repo"
    :columns="columns"
    :fields="fields"
    :schema="motifAdministratifInputSchema"
  />
</template>
