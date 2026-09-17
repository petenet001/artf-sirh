<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Sanction } from "~/schemas/sanction";
import { STATUTS_SANCTION } from "~/constants/enums";
import {
  agentNom,
  ETAPE_SANCTION_LABEL,
  STATUT_SANCTION_LABEL,
  type EtapeSanction,
} from "~/constants/discipline";

/**
 * Dossiers disciplinaires (CCN art. 90–91). Chaque rôle a sa file : la RH
 * instruit, le DG prononce, les chefs suivent leurs propres rapports — ils
 * n'ont pas `consulter-discipline` et ne voient donc que `mes-rapports`.
 */
const acteur = useActeurDiscipline();
const { sanctions, scope, pending, error, refresh } = useSanctions();

const modalOpen = ref(false);

const scopeItems = computed(() => [
  ...(acteur.value.peutGerer ? [{ label: "À instruire", value: "a_instruire" as const }] : []),
  ...(acteur.value.peutPrononcer ? [{ label: "À prononcer", value: "a_prononcer" as const }] : []),
  ...(acteur.value.peutProposer ? [{ label: "Mes rapports", value: "mes_rapports" as const }] : []),
  ...(acteur.value.peutConsulter ? [{ label: "Tous les dossiers", value: "all" as const }] : []),
]);

const ALL = "__all__";
const statutItems = [
  { label: "Tous les statuts", value: ALL },
  ...STATUTS_SANCTION.map((s) => ({ label: STATUT_SANCTION_LABEL[s], value: s })),
];
const statut = ref<string>(ALL);
// Filtre client : les files (`a-instruire`, `a-prononcer`…) n'acceptent pas de query.
const rows = computed(() =>
  statut.value === ALL ? sanctions.value : sanctions.value.filter((s) => s.statut === statut.value),
);

const columns: TableColumn<Sanction>[] = [
  {
    id: "agent",
    header: "Agent",
    accessorFn: (s) => agentNom(s.agent),
    cell: ({ row }) => agentNom(row.original.agent),
  },
  { id: "type", header: "Sanction envisagée" },
  {
    id: "faits",
    header: "Date des faits",
    cell: ({ row }) => formatDate(row.original.date_faits),
  },
  { id: "statut", header: "Statut" },
];
</script>

<template>
  <BasePanel title="Dossiers disciplinaires" subtitle="Rapport, instruction, prononcé (art. 90–91)">
    <BaseDataState :pending="pending" :error="error">
      <BaseTable
        :data="rows"
        :columns="columns"
        searchable
        search-placeholder="Rechercher un agent…"
        :page-size="10"
        :row-to="(s) => `/discipline/dossiers/${s.id}`"
      >
        <template #filters>
          <USelect v-if="scopeItems.length > 1" v-model="scope" :items="scopeItems" value-key="value" class="w-48" />
          <USelect v-model="statut" :items="statutItems" class="w-48" />
        </template>
        <template #actions>
          <UButton v-if="acteur.peutProposer" icon="i-lucide-plus" @click="modalOpen = true">
            Nouveau rapport
          </UButton>
        </template>
        <template #empty>
          <p class="py-6 text-center text-sm text-muted">Aucun dossier</p>
        </template>
        <template #type-cell="{ row }">
          <span class="text-sm">{{ row!.original.type_sanction?.nom ?? "—" }}</span>
        </template>
        <template #statut-cell="{ row }">
          <div class="flex items-center gap-2">
            <DisciplineStatutBadge :statut="row!.original.statut" :label="row!.original.statut_label" />
            <UBadge v-if="row!.original.prochaine_etape" color="neutral" variant="outline" size="sm">
              {{ ETAPE_SANCTION_LABEL[row!.original.prochaine_etape as EtapeSanction] }}
            </UBadge>
            <UBadge v-if="row!.original.recidive" color="error" variant="outline" size="sm">Récidive</UBadge>
          </div>
        </template>
      </BaseTable>
    </BaseDataState>

    <DisciplineRapportModal v-model:open="modalOpen" @created="refresh" />
  </BasePanel>
</template>
