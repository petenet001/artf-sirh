<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { CrudField } from "~/types/crud";
import { directionInputSchema, type Direction } from "~/schemas/direction";

const repo = useDirectionsApi();
const auth = useAuthStore();
const administrationsApi = useAdministrationsApi();
const { options: adminOptions, labelById: adminLabel } = useResourceOptions(
  "opt-administrations",
  () => administrationsApi.list(),
);

const columns = computed<TableColumn<Direction>[]>(() => [
  { accessorKey: "nom", header: "Nom" },
  { accessorKey: "sigle", header: "Sigle" },
  { id: "administration", header: "Administration", cell: ({ row }) => adminLabel.value[row.original.administration_id ?? -1] ?? "—" },
]);

const fields = computed<CrudField[]>(() => [
  { name: "nom", label: "Nom" },
  { name: "sigle", label: "Sigle" },
  { name: "description", label: "Description", type: "textarea" },
  { name: "administration_id", label: "Administration", type: "select", options: adminOptions.value, placeholder: "Choisir une administration" },
]);
</script>

<template>
  <BaseCrudManager
    cache-key="directions"
    title="Directions"
    subtitle="Structure organisationnelle"
    entity-label="Direction"
    searchable
    :repo="repo"
    :can-write="auth.can('creer-structure') || auth.can('modifier-structure')"
    :can-delete="auth.can('supprimer-structure')"
    :columns="columns"
    :fields="fields"
    :schema="directionInputSchema"
  />
</template>
