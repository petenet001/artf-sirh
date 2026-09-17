<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { PositionConventionnelle } from "~/schemas/position-conventionnelle";
import { STATUTS_POSITION, TYPES_POSITION } from "~/constants/enums";
import {
  agentNom,
  ETAPE_POSITION_LABEL,
  STATUT_POSITION_LABEL,
  TYPE_POSITION_LABEL,
  type EtapePosition,
  type TypePosition,
} from "~/constants/positions";

/**
 * Positions conventionnelles (CCN art. 76–80) : détachement, disponibilité,
 * position exceptionnelle, sous le drapeau.
 *
 * C'est **le** parcours pour ces quatre statuts : `PUT /integration/agents/{id}`
 * les refuse désormais. La RH soumet, le DG approuve, la RH clôture.
 */
const api = usePositionsApi();
const auth = useAuthStore();

const filters = reactive<Record<string, string | number | undefined>>({});
const { data, pending, error, refresh } = useAsyncData(
  "positions",
  () => api.list({ ...filters }),
  { watch: [filters] },
);
const positions = computed(() => data.value?.data ?? []);

const peutCreer = computed(() => auth.can("gerer-salaires"));
const modalOpen = ref(false);

const ALL = "__all__";
const typeItems = [
  { label: "Toutes les positions", value: ALL },
  ...TYPES_POSITION.map((t) => ({ label: TYPE_POSITION_LABEL[t], value: t })),
];
const statutItems = [
  { label: "Tous les statuts", value: ALL },
  ...STATUTS_POSITION.map((s) => ({ label: STATUT_POSITION_LABEL[s], value: s })),
];
const type = ref<string>(ALL);
const statut = ref<string>(ALL);
watch(type, (v) => (v === ALL ? delete filters.type : (filters.type = v)));
watch(statut, (v) => (v === ALL ? delete filters.statut : (filters.statut = v)));

const columns: TableColumn<PositionConventionnelle>[] = [
  {
    id: "agent",
    header: "Agent",
    accessorFn: (p) => agentNom(p.agent),
    cell: ({ row }) => agentNom(row.original.agent),
  },
  { id: "type", header: "Position" },
  { id: "periode", header: "Période" },
  { id: "statut", header: "Statut" },
];
</script>

<template>
  <BasePanel title="Positions conventionnelles" subtitle="Détachement, disponibilité et positions spéciales (art. 76–80)">
    <BaseDataState :pending="pending" :error="error">
      <BaseTable
        :data="positions"
        :columns="columns"
        searchable
        search-placeholder="Rechercher un agent…"
        :page-size="10"
        :row-to="(p) => `/carriere/positions/${p.id}`"
      >
        <template #filters>
          <USelect v-model="type" :items="typeItems" class="w-52" />
          <USelect v-model="statut" :items="statutItems" class="w-44" />
        </template>
        <template #actions>
          <UButton v-if="peutCreer" icon="i-lucide-plus" @click="modalOpen = true">Nouvelle position</UButton>
        </template>
        <template #empty>
          <p class="py-6 text-center text-sm text-muted">Aucune position</p>
        </template>
        <template #type-cell="{ row }">
          <div class="flex items-center gap-2">
            <span class="text-sm">
              {{ row!.original.type_label ?? TYPE_POSITION_LABEL[row!.original.type as TypePosition] }}
            </span>
            <UBadge v-if="row!.original.coupe_remuneration" color="warning" variant="outline" size="sm">
              Rémunération suspendue
            </UBadge>
          </div>
        </template>
        <template #periode-cell="{ row }">
          <span class="text-sm text-muted">
            {{ formatPeriode(row!.original.date_debut, row!.original.date_fin) }}
          </span>
        </template>
        <template #statut-cell="{ row }">
          <div class="flex items-center gap-2">
            <PositionsStatutBadge :statut="row!.original.statut" :label="row!.original.statut_label" />
            <UBadge v-if="row!.original.prochaine_etape" color="neutral" variant="outline" size="sm">
              {{ ETAPE_POSITION_LABEL[row!.original.prochaine_etape as EtapePosition] }}
            </UBadge>
          </div>
        </template>
      </BaseTable>
    </BaseDataState>

    <PositionsModal v-model:open="modalOpen" @created="refresh" />
  </BasePanel>
</template>
