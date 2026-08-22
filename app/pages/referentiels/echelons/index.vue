<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { CrudField } from "~/types/crud";
import { echelonInputSchema, type Echelon } from "~/schemas/echelon";

const repo = useEchelonsApi();

const columns: TableColumn<Echelon>[] = [
  { accessorKey: "nom", header: "Nom" },
  { accessorKey: "numero", header: "Numéro" },
];

const fields: CrudField[] = [
  { name: "nom", label: "Nom" },
  { name: "numero", label: "Numéro", type: "number" },
  { name: "description", label: "Description", type: "textarea" },
];
</script>

<template>
  <BaseCrudManager
    cache-key="echelons"
    title="Échelons"
    subtitle="Référentiel RH"
    entity-label="Échelon"
    searchable
    :repo="repo"
    :columns="columns"
    :fields="fields"
    :schema="echelonInputSchema"
  />
</template>
