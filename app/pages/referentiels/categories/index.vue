<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { CrudField } from "~/types/crud";
import { categorieInputSchema, type Categorie } from "~/schemas/categorie";

const repo = useCategoriesApi();

const columns: TableColumn<Categorie>[] = [
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
    cache-key="categories"
    title="Catégories"
    subtitle="Référentiel RH"
    entity-label="Catégorie"
    searchable
    :repo="repo"
    :columns="columns"
    :fields="fields"
    :schema="categorieInputSchema"
  />
</template>
