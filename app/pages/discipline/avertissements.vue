<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { CrudField } from "~/types/crud";
import { avertissementInputSchema, type Avertissement } from "~/schemas/avertissement";
import { agentNom } from "~/constants/discipline";

/**
 * Avertissements : mesure simple de la RH, **hors** circuit disciplinaire (pas
 * d'instruction ni de prononcé du DG). Ils comptent malgré tout dans
 * l'historique de l'agent.
 */
const repo = useAvertissementsApi();
const auth = useAuthStore();

const { options: agentOptions } = useResourceOptions("avertissement-agents", () => useAgentsApi().list(), (a) =>
  agentNom(a),
);

const columns: TableColumn<Avertissement>[] = [
  {
    id: "agent",
    header: "Agent",
    accessorFn: (a) => agentNom(a.agent),
    cell: ({ row }) => agentNom(row.original.agent),
  },
  { id: "date", header: "Date", cell: ({ row }) => formatDate(row.original.date) },
  { accessorKey: "motif", header: "Motif" },
];

const fields = computed<CrudField[]>(() => [
  { name: "agent_id", label: "Agent", type: "select", options: agentOptions.value },
  { name: "date", label: "Date", type: "date" },
  { name: "motif", label: "Motif", type: "textarea" },
]);
</script>

<template>
  <BaseCrudManager
    cache-key="avertissements"
    title="Avertissements"
    subtitle="Mesures simples, hors circuit disciplinaire"
    entity-label="Avertissement"
    :repo="repo"
    :can-write="auth.can('gerer-discipline')"
    :can-delete="auth.can('gerer-discipline')"
    :columns="columns"
    :fields="fields"
    :schema="avertissementInputSchema"
  />
</template>
