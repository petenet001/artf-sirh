<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { CrudField } from "~/types/crud";
import { motifAdministratifInputSchema, type MotifAdministratif } from "~/schemas/motif-administratif";

const repo = useMotifsAdministratifsApi();
const auth = useAuthStore();

const columns: TableColumn<MotifAdministratif>[] = [
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
    cache-key="motifs-administratifs"
    title="Motifs administratifs"
    subtitle="Référentiel RH"
    entity-label="Motif administratif"
    searchable
    :repo="repo"
    :can-write="auth.can('creer-referentiels') || auth.can('modifier-referentiels')"
    :can-delete="auth.can('supprimer-referentiels')"
    :columns="columns"
    :fields="fields"
    :schema="motifAdministratifInputSchema"
  />
</template>
