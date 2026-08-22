<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { CrudField } from "~/types/crud";
import { diplomeInputSchema, type Diplome } from "~/schemas/diplome";

const repo = useDiplomesApi();

const columns: TableColumn<Diplome>[] = [
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
    cache-key="diplomes"
    title="Diplômes"
    subtitle="Référentiel RH"
    entity-label="Diplôme"
    searchable
    :repo="repo"
    :columns="columns"
    :fields="fields"
    :schema="diplomeInputSchema"
  />
</template>
