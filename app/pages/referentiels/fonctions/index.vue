<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { CrudField } from "~/types/crud";
import { fonctionInputSchema, type Fonction } from "~/schemas/fonction";

const repo = useFonctionsApi();

const columns: TableColumn<Fonction>[] = [
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
    cache-key="fonctions"
    title="Fonctions"
    subtitle="Référentiel RH"
    entity-label="Fonction"
    searchable
    :repo="repo"
    :columns="columns"
    :fields="fields"
    :schema="fonctionInputSchema"
  />
</template>
