<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { CongeSolde } from "~/schemas/conge-solde";
import { agentNom } from "~/constants/conges";
import { estRh } from "~/constants/roles";

/**
 * Soldes de congé. Lecture seule : un solde est créé à la première lecture de
 * l'agent pour l'année, débité à la validation finale. Le solde initial inclut
 * le bonus d'ancienneté (paliers CCN art. 77), montré à part.
 *
 * ⚠️ `GET /conges/soldes` renvoie **tous** les agents à quiconque détient
 * `consulter-conges` — permission que le simple agent possède. La portée est
 * donc tenue ici : par défaut « Mes soldes » (route indexée par agent), et la
 * vue d'ensemble n'est proposée qu'aux valideurs et à la RH. Le nom d'agent
 * n'étant pas embarqué dans la ressource, il est résolu via le référentiel —
 * lui-même réservé à `consulter-agents`.
 */
const auth = useAuthStore();
const soldesApi = useCongeSoldesApi();
const agentsApi = useAgentsApi();

const agentId = computed(() => auth.user?.agent_id ?? 0);
const peutVoirTous = computed(
  () => auth.can("valider-conges") || estRh(auth.hasRole),
);

type PorteeSoldes = "mine" | "all";
const scope = ref<PorteeSoldes>(peutVoirTous.value ? "all" : "mine");
const scopeItems = computed(() => [
  ...(agentId.value ? [{ label: "Mes soldes", value: "mine" as const }] : []),
  ...(peutVoirTous.value ? [{ label: "Tous les agents", value: "all" as const }] : []),
]);

// Le référentiel agents n'est chargé que pour la vue d'ensemble : sur « Mes
// soldes », il n'y a qu'un nom à afficher, et l'agent n'y a pas droit.
const { labelById } = useResourceOptions(
  "soldes-agents-ref",
  () => (peutVoirTous.value ? agentsApi.list() : Promise.resolve({ data: [] })),
  (a) => agentNom(a),
);

const { data, pending, error } = useAsyncData(
  "conge-soldes",
  () => (scope.value === "mine" && agentId.value ? soldesApi.byAgent(agentId.value) : soldesApi.list()),
  { watch: [scope] },
);
const soldes = computed(() => data.value?.data ?? []);

const colonnesToutes: TableColumn<CongeSolde>[] = [
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

// Sur « Mes soldes », la colonne Agent n'apprend rien.
const columns = computed(() =>
  scope.value === "mine" ? colonnesToutes.filter((c) => c.id !== "agent") : colonnesToutes,
);
</script>

<template>
  <BasePanel title="Soldes de congé" subtitle="Droits acquis et restants">
    <BaseDataState :pending="pending" :error="error" :empty="!soldes.length" empty-label="Aucun solde enregistré">
      <BaseTable
        :data="soldes"
        :columns="columns"
        :searchable="scope === 'all'"
        search-placeholder="Rechercher un agent…"
        :page-size="15"
      >
        <template #filters>
          <USelect v-if="scopeItems.length > 1" v-model="scope" :items="scopeItems" value-key="value" class="w-48" />
        </template>
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
