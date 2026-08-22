<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { CrudField } from "~/types/crud";
import { serviceInputSchema, type Service } from "~/schemas/service";

const repo = useServicesApi();
const directionsApi = useDirectionsApi();
const { options: directionOptions, labelById: directionLabel } = useResourceOptions(
  "opt-directions",
  () => directionsApi.list(),
);

const columns = computed<TableColumn<Service>[]>(() => [
  { accessorKey: "nom", header: "Nom" },
  { accessorKey: "sigle", header: "Sigle" },
  { id: "direction", header: "Direction", cell: ({ row }) => directionLabel.value[row.original.direction_id ?? -1] ?? "—" },
]);

const fields = computed<CrudField[]>(() => [
  { name: "nom", label: "Nom" },
  { name: "sigle", label: "Sigle" },
  { name: "description", label: "Description", type: "textarea" },
  { name: "direction_id", label: "Direction", type: "select", options: directionOptions.value, placeholder: "Choisir une direction" },
]);
</script>

<template>
  <BaseCrudManager
    cache-key="services"
    title="Services"
    subtitle="Structure organisationnelle"
    entity-label="Service"
    searchable
    :repo="repo"
    :columns="columns"
    :fields="fields"
    :schema="serviceInputSchema"
  />
</template>
