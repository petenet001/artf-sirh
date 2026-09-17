<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Reclassement } from "~/schemas/reclassement";
import { STATUTS_RECLASSEMENT, TYPES_RECLASSEMENT } from "~/constants/enums";
import {
  agentNom,
  ETAPE_RECLASSEMENT_LABEL,
  STATUT_RECLASSEMENT_LABEL,
  TYPE_RECLASSEMENT_LABEL,
  type EtapeReclassement,
  type TypeReclassement,
} from "~/constants/reclassements";

/**
 * File des reclassements (CCN art. 73–75). Ouverte à qui consulte les salaires
 * — RH, admin **et** le DG, qui approuve les art. 74 et 75. La création et
 * l'application restent réservées à `gerer-salaires`.
 */
const auth = useAuthStore();
const api = useReclassementsApi();

const filters = reactive<Record<string, string | number | undefined>>({});
const { data, pending, error, refresh } = useAsyncData(
  "reclassements",
  () => api.list({ ...filters }),
  { watch: [filters] },
);
const reclassements = computed(() => data.value?.data ?? []);

const peutCreer = computed(() => auth.can("gerer-salaires"));
const modalOpen = ref(false);

const ALL = "__all__";
const statutItems = [
  { label: "Tous les statuts", value: ALL },
  ...STATUTS_RECLASSEMENT.map((s) => ({ label: STATUT_RECLASSEMENT_LABEL[s], value: s })),
];
const typeItems = [
  { label: "Tous les types", value: ALL },
  ...TYPES_RECLASSEMENT.map((t) => ({ label: TYPE_RECLASSEMENT_LABEL[t], value: t })),
];
const statut = ref<string>(ALL);
const type = ref<string>(ALL);

// Filtres serveur (égalité exacte) : on retire la clé plutôt que d'envoyer une sentinelle.
watch(statut, (v) => (v === ALL ? delete filters.statut : (filters.statut = v)));
watch(type, (v) => (v === ALL ? delete filters.type : (filters.type = v)));

const columns: TableColumn<Reclassement>[] = [
  {
    id: "agent",
    header: "Agent",
    accessorFn: (r) => agentNom(r.agent),
    cell: ({ row }) => agentNom(row.original.agent),
  },
  { id: "type", header: "Type" },
  { id: "classes", header: "Classe" },
  { id: "statut", header: "Statut" },
];
</script>

<template>
  <BasePanel title="Reclassements" subtitle="Changements de classe au titre des articles 73 à 75">
    <BaseDataState :pending="pending" :error="error">
      <BaseTable
        :data="reclassements"
        :columns="columns"
        searchable
        search-placeholder="Rechercher un agent…"
        :page-size="10"
        :row-to="(r) => `/carriere/reclassements/${r.id}`"
      >
        <template #filters>
          <USelect v-model="type" :items="typeItems" class="w-56" />
          <USelect v-model="statut" :items="statutItems" class="w-44" />
        </template>
        <template #actions>
          <UButton v-if="peutCreer" icon="i-lucide-plus" @click="modalOpen = true">Nouveau reclassement</UButton>
        </template>
        <template #empty>
          <p class="py-6 text-center text-sm text-muted">Aucun dossier de reclassement</p>
        </template>
        <template #type-cell="{ row }">
          <span class="text-sm">
            {{ row!.original.type_label ?? TYPE_RECLASSEMENT_LABEL[row!.original.type as TypeReclassement] }}
          </span>
        </template>
        <template #classes-cell="{ row }">
          <span class="text-sm text-muted">
            {{ row!.original.classe_origine?.grade ?? "—" }}
            <UIcon name="i-lucide-arrow-right" class="mx-1 size-3 align-middle" />
            {{ row!.original.classe_cible?.grade ?? "—" }}
          </span>
        </template>
        <template #statut-cell="{ row }">
          <div class="flex items-center gap-2">
            <ReclassementsStatutBadge :statut="row!.original.statut" :label="row!.original.statut_label" />
            <UBadge v-if="row!.original.prochaine_etape" color="neutral" variant="outline" size="sm">
              {{ ETAPE_RECLASSEMENT_LABEL[row!.original.prochaine_etape as EtapeReclassement] }}
            </UBadge>
          </div>
        </template>
      </BaseTable>
    </BaseDataState>

    <ReclassementsModal v-model:open="modalOpen" @created="refresh" />
  </BasePanel>
</template>
