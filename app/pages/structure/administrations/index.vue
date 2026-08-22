<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { CrudField } from "~/types/crud";
import { administrationInputSchema, type Administration } from "~/schemas/administration";

const repo = useAdministrationsApi();
const localitesApi = useLocalitesApi();
const { options: localiteOptions, labelById: localiteLabel } = useResourceOptions(
  "opt-localites",
  () => localitesApi.list(),
);

const columns = computed<TableColumn<Administration>[]>(() => [
  { accessorKey: "nom", header: "Nom" },
  { accessorKey: "sigle", header: "Sigle" },
  { id: "localite", header: "Localité", cell: ({ row }) => localiteLabel.value[row.original.localite_id ?? -1] ?? "—" },
]);

const fields = computed<CrudField[]>(() => [
  { name: "nom", label: "Nom" },
  { name: "sigle", label: "Sigle" },
  { name: "description", label: "Description", type: "textarea" },
  { name: "localite_id", label: "Localité", type: "select", options: localiteOptions.value, placeholder: "Choisir une localité" },
]);
</script>

<template>
  <BaseCrudManager
    cache-key="administrations"
    title="Administrations"
    subtitle="Structure organisationnelle"
    entity-label="Administration"
    searchable
    :repo="repo"
    :columns="columns"
    :fields="fields"
    :schema="administrationInputSchema"
  />
</template>
