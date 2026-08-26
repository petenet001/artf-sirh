<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { CrudField } from "~/types/crud";
import { typeAbsenceInputSchema, type TypeAbsence } from "~/schemas/type-absence";

const repo = useTypesAbsencesApi();
const auth = useAuthStore();

const columns: TableColumn<TypeAbsence>[] = [
  { accessorKey: "nom", header: "Nom" },
  { accessorKey: "justification_requise", header: "Justif. requise" },
];

const fields: CrudField[] = [
  { name: "nom", label: "Nom" },
  { name: "description", label: "Description", type: "textarea" },
  { name: "justification_requise", label: "Justification requise", type: "switch" },
];
</script>

<template>
  <BaseCrudManager
    cache-key="types-absences"
    title="Types d'absence"
    subtitle="Référentiel RH"
    entity-label="Type d'absence"
    searchable
    :repo="repo"
    :can-write="auth.can('creer-referentiels') || auth.can('modifier-referentiels')"
    :can-delete="auth.can('supprimer-referentiels')"
    :columns="columns"
    :fields="fields"
    :schema="typeAbsenceInputSchema"
  />
</template>
