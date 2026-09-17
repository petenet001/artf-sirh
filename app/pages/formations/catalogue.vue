<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { CatalogueFormation, CatalogueFormationInput } from "~/schemas/catalogue-formation";
import { catalogueFormationInputSchema } from "~/schemas/catalogue-formation";
import { MODALITES_FORMATION, TYPES_ACTION_FORMATION } from "~/constants/enums";
import { MODALITE_FORMATION_LABEL, TYPE_ACTION_LABEL, type TypeActionFormation } from "~/constants/formations";
import type { CrudField } from "~/types/crud";

/**
 * Catalogue des actions de formation (CCN art. 92–104). Le **type d'action**
 * porte son propre plafond de durée, rappelé par l'API (`duree_max_mois`) :
 * 9 mois pour un perfectionnement, 36 pour une qualification ou une école.
 *
 * `anciennete_min_ans` (3 ans par défaut, art. 92) conditionne l'inscription ;
 * `debit_formation_mois` fixe l'engagement de service après la formation.
 */
const formations = useFormationsApi();
const auth = useAuthStore();

/** Adapte le repository Formation au contrat attendu par `BaseCrudManager`. */
const repo = {
  list: (params?: Record<string, string | number | boolean | undefined>) => formations.catalogue(params),
  create: (payload: CatalogueFormationInput) => formations.creerFormation(payload),
  update: (id: number, payload: Partial<CatalogueFormationInput>) => formations.modifierFormation(id, payload),
  remove: (id: number) => formations.supprimerFormation(id),
};

const columns: TableColumn<CatalogueFormation>[] = [
  { accessorKey: "titre", header: "Formation" },
  {
    id: "type_action",
    header: "Type d'action",
    accessorFn: (f) => (f.type_action ? TYPE_ACTION_LABEL[f.type_action as TypeActionFormation] : "—"),
    cell: ({ row }) =>
      row.original.type_action_label ??
      (row.original.type_action ? TYPE_ACTION_LABEL[row.original.type_action as TypeActionFormation] : "—"),
  },
  { accessorKey: "organisme", header: "Organisme" },
  {
    id: "duree",
    header: "Durée",
    cell: ({ row }) => (row.original.duree_jours ? `${row.original.duree_jours} j` : "—"),
  },
];

const fields: CrudField[] = [
  { name: "titre", label: "Intitulé" },
  {
    name: "type_action",
    label: "Type d'action",
    type: "select",
    options: TYPES_ACTION_FORMATION.map((t) => ({ label: TYPE_ACTION_LABEL[t], value: t })),
    help: "Perfectionnement : 9 mois max. Qualification et école : 36 mois max.",
  },
  {
    name: "modalite",
    label: "Modalité",
    type: "select",
    options: MODALITES_FORMATION.map((m) => ({ label: MODALITE_FORMATION_LABEL[m], value: m })),
  },
  { name: "organisme", label: "Organisme" },
  { name: "lieu", label: "Lieu" },
  { name: "duree_jours", label: "Durée (jours)", type: "number" },
  { name: "cout", label: "Coût", type: "number" },
  {
    name: "anciennete_min_ans",
    label: "Ancienneté minimale (ans)",
    type: "number",
    help: "3 ans par défaut (art. 92).",
  },
  {
    name: "debit_formation_mois",
    label: "Engagement de service (mois)",
    type: "number",
    help: "Durée de service due après la formation (art. 104).",
  },
  { name: "description", label: "Description", type: "textarea" },
  { name: "actif", label: "Formation active", type: "switch" },
];
</script>

<template>
  <BaseCrudManager
    cache-key="catalogue-formations"
    title="Catalogue de formation"
    subtitle="Actions de formation ouvertes aux agents (art. 92–104)"
    entity-label="Formation"
    searchable
    :repo="repo"
    :can-write="auth.can('gerer-formations')"
    :can-delete="auth.can('gerer-formations')"
    :columns="columns"
    :fields="fields"
    :schema="catalogueFormationInputSchema"
  />
</template>
