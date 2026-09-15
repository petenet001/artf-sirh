<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { CongeSolde } from "~/schemas/conge-solde";
import { agentNom } from "~/constants/conges";

/**
 * Soldes de congé des agents. Lecture seule : un solde est créé à la première
 * lecture de l'agent pour l'année, débité à la validation finale. Le solde
 * initial inclut le bonus d'ancienneté (paliers CCN art. 77), montré à part.
 * Le nom d'agent n'étant pas embarqué dans la ressource, on le résout via le
 * référentiel agents.
 */
const soldesApi = useCongeSoldesApi();
const agentsApi = useAgentsApi();

const { labelById } = useResourceOptions("soldes-agents-ref", () => agentsApi.list(), (a) => agentNom(a));

const { data, pending, error } = useAsyncData("conge-soldes", () => soldesApi.list());
const soldes = computed(() => data.value?.data ?? []);

const columns: TableColumn<CongeSolde>[] = [
  { id: "agent", header: "Agent", cell: ({ row }) => labelById.value[row.original.agent_id] ?? `#${row.original.agent_id}` },
  { id: "type", header: "Type", cell: ({ row }) => row.original.type_conge?.nom ?? `#${row.original.type_conge_id}` },
  { accessorKey: "annee", header: "Année" },
  { accessorKey: "solde_initial", header: "Solde initial" },
  {
    id: "jours_anciennete",
    header: "Dont ancienneté",
    cell: ({ row }) => (row.original.jours_anciennete ? `+${row.original.jours_anciennete}` : "—"),
  },
  { id: "solde_actuel", header: "Solde actuel" },
];
</script>

<template>
  <BasePanel title="Soldes de congé" subtitle="Droits acquis et restants par agent">
    <BaseDataState :pending="pending" :error="error" :empty="!soldes.length" empty-label="Aucun solde enregistré">
      <BaseTable :data="soldes" :columns="columns" searchable search-placeholder="Rechercher un agent…" :page-size="15">
        <template #solde_actuel-cell="{ row }">
          <span
            class="font-semibold"
            :class="row!.original.solde_actuel <= 0 ? 'text-error' : 'text-highlighted'"
          >
            {{ row!.original.solde_actuel }}
          </span>
        </template>
      </BaseTable>
    </BaseDataState>
  </BasePanel>
</template>
