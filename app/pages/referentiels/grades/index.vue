<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { CrudField } from "~/types/crud";
import { gradeInputSchema, type Grade } from "~/schemas/grade";

const repo = useGradesApi();
const auth = useAuthStore();

const columns: TableColumn<Grade>[] = [
  { accessorKey: "nom", header: "Nom" },
  { accessorKey: "sigle", header: "Sigle" },
  { accessorKey: "niveau", header: "Niveau" },
];

const fields: CrudField[] = [
  { name: "nom", label: "Nom" },
  { name: "sigle", label: "Sigle" },
  { name: "niveau", label: "Niveau", type: "number" },
  { name: "description", label: "Description", type: "textarea" },
];
</script>

<template>
  <BaseCrudManager
    cache-key="grades"
    title="Grades"
    subtitle="Référentiel RH"
    entity-label="Grade"
    searchable
    :repo="repo"
    :can-write="auth.can('creer-referentiels') || auth.can('modifier-referentiels')"
    :can-delete="auth.can('supprimer-referentiels')"
    :columns="columns"
    :fields="fields"
    :schema="gradeInputSchema"
  />
</template>
