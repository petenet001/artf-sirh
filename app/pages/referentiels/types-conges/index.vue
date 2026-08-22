<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { CrudField } from "~/types/crud";
import { typeCongeInputSchema, type TypeConge } from "~/schemas/type-conge";

const repo = useTypesCongesApi();

const columns: TableColumn<TypeConge>[] = [
  { accessorKey: "nom", header: "Nom" },
  { accessorKey: "jours_max", header: "Jours max" },
];

const fields: CrudField[] = [
  { name: "nom", label: "Nom" },
  { name: "jours_max", label: "Jours max", type: "number" },
  { name: "description", label: "Description", type: "textarea" },
];
</script>

<template>
  <BaseCrudManager
    cache-key="types-conges"
    title="Types de congé"
    subtitle="Référentiel RH"
    entity-label="Type de congé"
    searchable
    :repo="repo"
    :columns="columns"
    :fields="fields"
    :schema="typeCongeInputSchema"
  />
</template>
