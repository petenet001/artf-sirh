<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { agentColumns } from "~/constants/columns/agents";
import type { AgentSummary } from "~/schemas/agent-summary";

/**
 * Liste d'agents façon maquette : barre d'outils (recherche + filtres +
 * actions), cellule personne (avatar + nom + matricule), statut en pastille et
 * actions de fin de ligne. Partagée par les pages « Agents », « Stagiaires » et
 * « Mon entité » pour que toutes les listes de personnes soient identiques.
 *
 * Typée sur `AgentSummary` (socle scalaire) : accepte aussi bien les agents
 * complets que les agents imbriqués dans une affectation.
 */
defineProps<{ agents: AgentSummary[] }>();

const columns: TableColumn<AgentSummary>[] = [...agentColumns, { id: "actions", header: "" }];
</script>

<template>
  <BaseTable
    :data="agents"
    :columns="columns"
    searchable
    search-placeholder="Rechercher (matricule, nom, prénom…)"
    :page-size="10"
  >
    <template #filters>
      <slot name="filters" />
    </template>
    <template #actions>
      <slot name="actions" />
    </template>

    <template #nom-cell="{ row }">
      <BasePersonCell
        :name="row!.original.nom_complet ?? `${row!.original.prenom} ${row!.original.nom}`"
        :subtitle="row!.original.matricule ?? 'Matricule non assigné'"
        :src="row!.original.photo_path"
      />
    </template>

    <template #statut-cell="{ row }">
      <AgentsStatutBadge :statut="row!.original.statut" />
    </template>

    <template #actions-cell="{ row }">
      <BaseRowActions
        :view-to="`/personnel/agents/${row!.original.id}`"
        :edit-to="`/personnel/agents/${row!.original.id}/modifier`"
        label="l'agent"
      />
    </template>
  </BaseTable>
</template>
