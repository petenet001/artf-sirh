<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { CrudField } from "~/types/crud";
import { typeCongeInputSchema, type TypeConge } from "~/schemas/type-conge";

const repo = useTypesCongesApi();
const auth = useAuthStore();

const columns: TableColumn<TypeConge>[] = [
  { accessorKey: "nom", header: "Nom" },
  { accessorKey: "jours_max", header: "Jours max" },
];

const fields: CrudField[] = [
  { name: "nom", label: "Nom" },
  { name: "jours_max", label: "Jours max", type: "number", help: "0 = pas de plafond (ex. maladie)." },
  { name: "description", label: "Description", type: "textarea" },
  { name: "necessite_n1", label: "Validation supérieur (N+1)", type: "switch" },
  { name: "necessite_rh", label: "Validation RH", type: "switch" },
  { name: "necessite_dg", label: "Validation DG", type: "switch" },
  { name: "debite_solde", label: "Décompte du solde", type: "switch" },
  { name: "justificatif_requis", label: "Justificatif obligatoire", type: "switch" },
];
</script>

<template>
  <BaseCrudManager
    cache-key="types-conges"
    title="Types de congé"
    subtitle="Référentiel RH"
    entity-label="Type de congé"
    searchable
    :repo="repo"
    :can-write="auth.can('creer-referentiels') || auth.can('modifier-referentiels')"
    :can-delete="auth.can('supprimer-referentiels')"
    :columns="columns"
    :fields="fields"
    :schema="typeCongeInputSchema"
  />
</template>
