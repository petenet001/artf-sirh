<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Evaluation } from "~/schemas/evaluation";
import { agentNom, ETAPE_EVALUATION_LABEL, type EtapeEvaluation } from "~/constants/evaluations";

/**
 * Liste de fiches d'évaluation — partagée par « Mes évaluations », « À noter »,
 * la vue RH et le détail d'une session : une population = une table, les
 * écrans doivent rester visuellement identiques (CLAUDE.md §10).
 *
 * `colonne` retire la colonne redondante selon le contexte : inutile de répéter
 * l'agent dans « Mes évaluations », ou le notateur dans « À noter ».
 */
withDefaults(
  defineProps<{
    evaluations: Evaluation[];
    /** Colonne d'identité à masquer (déjà impliquée par l'écran). */
    masquer?: "agent" | "superieur" | "none";
    emptyLabel?: string;
    searchable?: boolean;
  }>(),
  { masquer: "none", emptyLabel: "Aucune fiche", searchable: true },
);

const columns: TableColumn<Evaluation>[] = [
  {
    id: "agent",
    header: "Agent",
    accessorFn: (e) => agentNom(e.agent),
    cell: ({ row }) => agentNom(row.original.agent),
  },
  {
    id: "superieur",
    header: "Notateur (N+1)",
    accessorFn: (e) => agentNom(e.superieur),
    cell: ({ row }) => agentNom(row.original.superieur),
  },
  {
    id: "session",
    header: "Session",
    cell: ({ row }) => formatDate(row.original.session?.debut_session) ?? "—",
  },
  { id: "note", header: "Note" },
  { id: "statut", header: "Statut" },
];

const ETAPE_LABEL = ETAPE_EVALUATION_LABEL;
</script>

<template>
  <BaseTable
    :data="evaluations"
    :columns="columns.filter((c) => c.id !== masquer)"
    :searchable="searchable"
    search-placeholder="Rechercher un agent…"
    :page-size="10"
    :row-to="(e) => `/evaluations/fiches/${e.id}`"
  >
    <template #filters><slot name="filters" /></template>
    <template #actions><slot name="actions" /></template>
    <template #empty>
      <p class="py-6 text-center text-sm text-muted">{{ emptyLabel }}</p>
    </template>
    <template #session-cell="{ row }">
      <span class="text-sm">{{ row!.original.session?.description ?? formatDate(row!.original.session?.debut_session) }}</span>
    </template>
    <template #note-cell="{ row }">
      <EvaluationsMentionBadge :note="row!.original.note_globale" :mention="row!.original.mention" />
    </template>
    <template #statut-cell="{ row }">
      <div class="flex items-center gap-2">
        <EvaluationsStatutBadge :statut="row!.original.statut" :label="row!.original.statut_label" />
        <UBadge v-if="row!.original.prochaine_etape" color="neutral" variant="outline" size="sm">
          {{ ETAPE_LABEL[row!.original.prochaine_etape as EtapeEvaluation] }}
        </UBadge>
      </div>
    </template>
  </BaseTable>
</template>
