<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { CrudField } from "~/types/crud";
import { typeContratInputSchema, type TypeContrat } from "~/schemas/type-contrat";

const repo = useTypesContratsApi();
const auth = useAuthStore();

const columns: TableColumn<TypeContrat>[] = [
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
    cache-key="types-contrats"
    title="Types de contrat"
    subtitle="Référentiel RH"
    entity-label="Type de contrat"
    searchable
    :repo="repo"
    :can-write="auth.can('creer-referentiels') || auth.can('modifier-referentiels')"
    :can-delete="auth.can('supprimer-referentiels')"
    :columns="columns"
    :fields="fields"
    :schema="typeContratInputSchema"
  />
</template>
