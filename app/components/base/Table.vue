<script setup lang="ts" generic="T">
import type { TableColumn } from "@nuxt/ui";
import { getPaginationRowModel, type SortingState, type Row, type Column } from "@tanstack/vue-table";

/**
 * Table de liste standard : conteneur arrondi « épuré » + `UTable` (Nuxt UI)
 * câblé avec tri, recherche et pagination **client** (pur affichage — l'API ne
 * pagine pas et renvoie une collection plate ; ces traitements ne touchent
 * jamais le serveur). Centralise le style et tue le boilerplate des pages.
 *
 * Barre d'outils et pied de table calés sur la maquette : recherche à gauche,
 * actions à droite ; en pied, sélecteur de taille de page, compteur
 * « Affichage de X à Y sur N » et pagination.
 *
 * - `searchable` : barre de recherche réactive (filtre global « contient »).
 * - `pageSize`   : active la pagination client (pied de table).
 * - `bordered`   : encadré (par défaut) ; `false` dans une carte.
 * - slot `#filters` : filtres additionnels, à gauche à côté de la recherche.
 * - slot `#actions` : boutons de la barre d'outils, à droite.
 * - slot `#empty`   : message quand la liste est vide. Un défaut français est
 *   fourni, et c'est **ici** que l'état vide d'une liste se rend — surtout pas
 *   en masquant la table : la barre d'outils, donc le bouton « Nouveau », doit
 *   rester visible. Une liste vide est précisément le moment où l'on a besoin
 *   de créer le premier élément (cf. `emptyLabel`).
 * - tous les slots de colonnes (`#<col>-cell`, `#<col>-header`, `#empty`…)
 *   sont transmis à `UTable`.
 */
const props = withDefaults(
  defineProps<{
    data: T[];
    columns: TableColumn<T>[];
    loading?: boolean;
    sticky?: boolean;
    bordered?: boolean;
    searchable?: boolean;
    searchPlaceholder?: string;
    pageSize?: number;
    /** Message affiché quand la liste est vide (le slot `#empty` l'emporte). */
    emptyLabel?: string;
    /** Rend chaque ligne cliquable : navigue vers l'URL calculée depuis la ligne. */
    rowTo?: (row: T) => string;
  }>(),
  {
    bordered: true,
    searchPlaceholder: "Rechercher…",
    pageSize: undefined,
    rowTo: undefined,
    emptyLabel: "Aucun élément à afficher",
  },
);

// Clic de ligne -> navigation (quand `rowTo` est fourni).
function onRowSelect(_e: Event, row: Row<T>) {
  if (props.rowTo) navigateTo(props.rowTo(row.original));
}
const selectHandler = computed(() => (props.rowTo ? onRowSelect : undefined));
const tableUi = computed(() => (props.rowTo ? { tr: "cursor-pointer" } : undefined));

// Slots transmis à UTable (cellules/en-têtes typés sur T) + barre de filtres.
// Props optionnelles : la portée d'un slot à nom dynamique est typée « {} » par
// le compilateur ; les consommateurs lèvent l'ambiguïté avec `row!` au besoin.
defineSlots<Record<string, (props: { row?: Row<T>; column?: Column<T> }) => unknown>>();

// Réf typée a minima (évite l'inférence circulaire sur un composant générique).
const table = useTemplateRef<{
  tableApi?: {
    getFilteredRowModel: () => { rows: unknown[] };
    setPageIndex: (index: number) => void;
    setPageSize: (size: number) => void;
  };
}>("table");
const tableApi = computed(() => table.value?.tableApi);

// États de table (tri / recherche / pagination) — 100 % côté client.
const sorting = ref<SortingState>([]);
const globalFilter = ref("");
const pagination = ref({ pageIndex: 0, pageSize: props.pageSize ?? 10 });

// Nombre de lignes après recherche, pour piloter la pagination.
const filteredCount = computed<number>(() => {
  void globalFilter.value; // dépendances : recompte au changement de recherche…
  void props.data; // …et quand les données (re)chargées changent.
  return table.value?.tableApi?.getFilteredRowModel().rows.length ?? props.data.length;
});

// Changement de page / de taille : on passe par l'API du tableau (TanStack).
// Muter une propriété imbriquée de `pagination` ne déclenche pas la re-slice
// de UTable — `setPageIndex` / `setPageSize` sont la voie fiable (cf. doc Nuxt UI).
// `v-model:pagination` renvoie ensuite l'état à `pagination` pour l'affichage.
const page = computed(() => pagination.value.pageIndex + 1);
function goToPage(p: number) {
  tableApi.value?.setPageIndex(p - 1);
}

// Sélecteur « Affichage [10] » du pied de table.
const pageSizes = [10, 25, 50, 100];
const perPage = computed<number>({
  get: () => pagination.value.pageSize,
  set: (size: number) => {
    tableApi.value?.setPageSize(size);
    tableApi.value?.setPageIndex(0);
  },
});

// Bornes affichées : « Affichage de {from} à {to} sur {filteredCount} ».
const from = computed(() => (filteredCount.value ? pagination.value.pageIndex * perPage.value + 1 : 0));
const to = computed(() => Math.min(from.value + perPage.value - 1, filteredCount.value));

// Revenir à la première page quand la recherche ou les données changent.
watch([globalFilter, () => props.data], () => {
  pagination.value.pageIndex = 0;
});
</script>

<template>
  <div class="space-y-4">
    <div
v-if="searchable || $slots.filters || $slots.actions"
      class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-1 flex-wrap items-center gap-2">
        <UInput
v-if="searchable" v-model="globalFilter" icon="i-lucide-search" :placeholder="searchPlaceholder"
          class="w-full max-w-sm" />
        <slot name="filters" />
      </div>
      <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
        <slot name="actions" />
      </div>
    </div>

    <div :class="bordered && 'overflow-hidden rounded-xl border border-default bg-default'">
      <UTable
ref="table" v-model:sorting="sorting" v-model:global-filter="globalFilter" v-model:pagination="pagination"
        :pagination-options="pageSize ? { getPaginationRowModel: getPaginationRowModel() } : undefined" :data="data"
        :columns="columns" :loading="loading" :sticky="sticky" :on-select="selectHandler" :ui="tableUi">
        <template v-for="(_, name) in $slots" #[name]="slotData">
          <slot v-if="name !== 'filters' && name !== 'actions'" :name="name" v-bind="slotData" />
        </template>

        <!-- État vide par défaut, en français, si la page n'en fournit pas :
             `UTable` afficherait sinon son libellé anglais. -->
        <template v-if="!$slots.empty" #empty>
          <div class="flex flex-col items-center justify-center gap-2 py-10">
            <UIcon name="i-lucide-inbox" class="size-6 text-dimmed" />
            <p class="text-sm text-muted">{{ emptyLabel }}</p>
          </div>
        </template>
      </UTable>
    </div>


    <div v-if="pageSize && filteredCount" class="flex flex-wrap items-center justify-between gap-3 px-1">
      <div class="flex items-center gap-2 text-sm text-muted">
        <span>Affichage</span>
        <USelect v-model="perPage" :items="pageSizes" class="w-20" />
      </div>
      <p class="text-sm text-muted">
        Affichage de {{ from }} à {{ to }} sur {{ filteredCount }} enregistrement{{ filteredCount > 1 ? "s" : "" }}
      </p>
      <UPagination
v-if="filteredCount > perPage" :page="page" :items-per-page="perPage"
        :total="filteredCount" @update:page="goToPage" />
      <span v-else />
    </div>
  </div>
</template>
