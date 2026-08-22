<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { SalaireAgent } from "~/schemas/salaire-agent";

/** Liste des salaires réels des agents (module Rémunération). */
const { salaires, pending, error } = useSalairesAgents();

const fmt = (n: number | null | undefined) =>
  n == null ? "—" : new Intl.NumberFormat("fr-FR").format(n);

const statutColor: Record<string, "success" | "neutral"> = {
  actif: "success",
  cloture: "neutral",
};

const columns: TableColumn<SalaireAgent>[] = [
  {
    id: "agent",
    header: "Agent",
    cell: ({ row }) => row.original.agent?.nom_complet ?? `Agent #${row.original.agent_id ?? row.original.id}`,
  },
  { accessorKey: "echelon", header: "Échelon" },
  { id: "montant_base", header: "Base (FCFA)", cell: ({ row }) => fmt(row.original.montant_base) },
  { id: "montant_net", header: "Net (FCFA)", cell: ({ row }) => fmt(row.original.montant_net) },
  dateColumn<SalaireAgent>("date_debut", "Depuis"),
  { id: "statut", header: "Statut" },
];
</script>

<template>
  <BasePanel
    title="Salaires des agents"
    subtitle="Rémunération réelle par agent, avec échelon et statut."
  >
    <BaseDataState :pending="pending" :error="error" :empty="!salaires.length" empty-label="Aucun salaire d'agent">
      <BaseTable :data="salaires" :columns="columns" :page-size="15" searchable search-placeholder="Rechercher un agent…">
        <template #statut-cell="{ row }">
          <UBadge :color="statutColor[row!.original.statut] ?? 'neutral'" variant="subtle" class="capitalize">
            {{ row!.original.statut }}
          </UBadge>
        </template>
      </BaseTable>
    </BaseDataState>
  </BasePanel>
</template>
