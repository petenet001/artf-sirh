<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { CrudField } from "~/types/crud";
import { localiteInputSchema, type Localite } from "~/schemas/localite";

const repo = useLocalitesApi();

const columns: TableColumn<Localite>[] = [
  { accessorKey: "nom", header: "Nom" },
  { accessorKey: "sigle", header: "Sigle" },
];

const fields: CrudField[] = [
  { name: "nom", label: "Nom" },
  { name: "sigle", label: "Sigle" },
  { name: "description", label: "Description", type: "textarea" },
];
</script>

<template>
  <BaseCrudManager
    cache-key="localites"
    title="Localités"
    subtitle="Structure organisationnelle"
    entity-label="Localité"
    searchable
    :repo="repo"
    :columns="columns"
    :fields="fields"
    :schema="localiteInputSchema"
  />
</template>
