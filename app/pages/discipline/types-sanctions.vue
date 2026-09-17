<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { CrudField } from "~/types/crud";
import { typeSanctionInputSchema, type TypeSanction } from "~/schemas/type-sanction";
import { CODES_TYPE_SANCTION, GRAVITES_SANCTION } from "~/constants/enums";
import { CODE_TYPE_SANCTION_LABEL, GRAVITE_SANCTION_LABEL, type GraviteSanction } from "~/constants/discipline";

/**
 * Référentiel des sanctions (CCN art. 90). Quatre types réglementaires
 * seulement sont actifs ; les types hors CCN (mutation d'office,
 * rétrogradation) restent en base mais désactivés.
 *
 * ⚠️ Un type CCN **ne peut pas** être supprimé (422) : le passer à « inactif ».
 */
const repo = useTypesSanctionsApi();
const auth = useAuthStore();

const columns: TableColumn<TypeSanction>[] = [
  { accessorKey: "nom", header: "Sanction" },
  {
    id: "gravite",
    header: "Gravité",
    accessorFn: (t) => (t.gravite ? GRAVITE_SANCTION_LABEL[t.gravite as GraviteSanction] : "—"),
    cell: ({ row }) =>
      row.original.gravite_label ??
      (row.original.gravite ? GRAVITE_SANCTION_LABEL[row.original.gravite as GraviteSanction] : "—"),
  },
  {
    id: "duree",
    header: "Durée",
    cell: ({ row }) =>
      row.original.exige_nb_jours
        ? `${row.original.nb_jours_min ?? 1} à ${row.original.nb_jours_max ?? 8} jours`
        : "—",
  },
];

const fields: CrudField[] = [
  { name: "nom", label: "Intitulé" },
  {
    name: "code",
    label: "Code CCN",
    type: "select",
    options: CODES_TYPE_SANCTION.map((c) => ({ label: CODE_TYPE_SANCTION_LABEL[c], value: c })),
    help: "Laisser vide pour un type hors convention.",
  },
  {
    name: "gravite",
    label: "Gravité",
    type: "select",
    options: GRAVITES_SANCTION.map((g) => ({ label: GRAVITE_SANCTION_LABEL[g], value: g })),
  },
  { name: "exige_nb_jours", label: "Exige une durée (mise à pied)", type: "switch" },
  { name: "nb_jours_min", label: "Durée minimale (jours)", type: "number" },
  { name: "nb_jours_max", label: "Durée maximale (jours)", type: "number", help: "8 jours au plus (art. 90)." },
  { name: "description", label: "Description", type: "textarea" },
  { name: "actif", label: "Type actif", type: "switch", help: "Inactif = retiré des rapports à venir." },
];
</script>

<template>
  <BaseCrudManager
    cache-key="types-sanctions"
    title="Types de sanction"
    subtitle="Référentiel disciplinaire (CCN art. 90)"
    entity-label="Type de sanction"
    :repo="repo"
    :can-write="auth.can('gerer-discipline')"
    :can-delete="auth.can('gerer-discipline')"
    :columns="columns"
    :fields="fields"
    :schema="typeSanctionInputSchema"
  />
</template>
