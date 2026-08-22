<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { CrudField } from "~/types/crud";
import { typeDocumentInputSchema, type TypeDocument } from "~/schemas/type-document";

const repo = useTypesDocumentsApi();

const columns: TableColumn<TypeDocument>[] = [
  { accessorKey: "nom", header: "Nom" },
  { accessorKey: "obligatoire", header: "Obligatoire" },
];

const fields: CrudField[] = [
  { name: "nom", label: "Nom" },
  { name: "description", label: "Description", type: "textarea" },
  { name: "obligatoire", label: "Obligatoire", type: "switch" },
];
</script>

<template>
  <BaseCrudManager
    cache-key="types-documents"
    title="Types de document"
    subtitle="Référentiel intégration"
    entity-label="Type de document"
    searchable
    :repo="repo"
    :columns="columns"
    :fields="fields"
    :schema="typeDocumentInputSchema"
  />
</template>
