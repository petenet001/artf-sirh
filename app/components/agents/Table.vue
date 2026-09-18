<script setup lang="ts" generic="T extends AgentSummary">
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
 *
 * Générique sur `T extends AgentSummary` — comme `BaseTable` : une page qui
 * dispose de la fiche complète (avec `affectation_active`) peut s'en servir
 * dans ses rendus sans recourir à un cast.
 *
 * `structureDe` ajoute une colonne « Structure ». Elle est optionnelle et
 * passée par l'appelant plutôt que résolue ici : la filiation demande
 * l'organigramme, que toutes les pages n'ont pas besoin de charger — et « Mon
 * entité », qui ne liste qu'une seule structure, n'a rien à y gagner.
 */
const props = defineProps<{
  agents: T[];
  /** Libellé d'affectation d'un agent. Absent = pas de colonne. */
  structureDe?: (agent: T) => string;
}>();

const columns = computed<TableColumn<T>[]>(() => [
  ...agentColumns<T>(),
  // Insérée juste après l'identité : c'est la première question qu'on se pose
  // en parcourant une liste d'agents qu'on ne connaît pas tous.
  ...(props.structureDe ? [{ id: "structure", header: "Structure" }] : []),
  { id: "actions", header: "" },
]);
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

    <template v-if="structureDe" #structure-cell="{ row }">
      <span class="text-sm text-muted">{{ structureDe(row!.original) }}</span>
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
