<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { CrudField } from "~/types/crud";
import { bureauInputSchema, type Bureau } from "~/schemas/bureau";

const repo = useBureauxApi();
const auth = useAuthStore();
const servicesApi = useServicesApi();
const { options: serviceOptions, labelById: serviceLabel } = useResourceOptions(
  "opt-services",
  () => servicesApi.list(),
);

const columns = computed<TableColumn<Bureau>[]>(() => [
  { accessorKey: "nom", header: "Nom" },
  { accessorKey: "sigle", header: "Sigle" },
  { id: "service", header: "Service", cell: ({ row }) => serviceLabel.value[row.original.service_id ?? -1] ?? "—" },
]);

const fields = computed<CrudField[]>(() => [
  { name: "nom", label: "Nom" },
  { name: "sigle", label: "Sigle" },
  { name: "description", label: "Description", type: "textarea" },
  { name: "service_id", label: "Service", type: "select", options: serviceOptions.value, placeholder: "Choisir un service" },
]);
</script>

<template>
  <BaseCrudManager
    cache-key="bureaux"
    title="Bureaux"
    subtitle="Structure organisationnelle"
    entity-label="Bureau"
    searchable
    :repo="repo"
    :can-write="auth.can('creer-structure') || auth.can('modifier-structure')"
    :can-delete="auth.can('supprimer-structure')"
    :columns="columns"
    :fields="fields"
    :schema="bureauInputSchema"
  />
</template>
