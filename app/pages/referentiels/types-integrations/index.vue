<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { CrudField } from "~/types/crud";
import { typeIntegrationInputSchema, type TypeIntegration } from "~/schemas/type-integration";

const repo = useTypesIntegrationsApi();
const auth = useAuthStore();

const columns: TableColumn<TypeIntegration>[] = [
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
    cache-key="types-integrations"
    title="Types d'intégration"
    subtitle="Référentiel intégration"
    entity-label="Type d'intégration"
    searchable
    :repo="repo"
    :can-write="auth.can('creer-referentiels') || auth.can('modifier-referentiels')"
    :can-delete="auth.can('supprimer-referentiels')"
    :columns="columns"
    :fields="fields"
    :schema="typeIntegrationInputSchema"
  />
</template>
