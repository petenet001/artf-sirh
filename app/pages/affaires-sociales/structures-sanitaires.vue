<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { CrudField } from "~/types/crud";
import {
  structureSanitaireInputSchema,
  type StructureSanitaire,
} from "~/schemas/structure-sanitaire";
import { TYPES_STRUCTURE_SANITAIRE } from "~/constants/enums";
import {
  TYPE_STRUCTURE_SANITAIRE_LABEL,
  type TypeStructureSanitaire,
} from "~/constants/dossiers-sociaux";

/**
 * Structures sanitaires agréées : médecins, formations sanitaires, opticiens,
 * pharmacies.
 *
 * C'est un **référentiel** : les arrêts, prises en charge et visites s'y
 * rattachent. Une structure déréférencée se **désactive** et ne se supprime
 * pas — les dossiers passés doivent rester lisibles avec le nom de l'endroit
 * où les soins ont réellement eu lieu.
 */
const repo = useStructuresSanitairesApi();
const auth = useAuthStore();

const columns: TableColumn<StructureSanitaire>[] = [
  { accessorKey: "nom", header: "Structure" },
  {
    id: "type",
    header: "Type",
    accessorFn: (s) => (s.type ? TYPE_STRUCTURE_SANITAIRE_LABEL[s.type as TypeStructureSanitaire] : "—"),
    cell: ({ row }) =>
      row.original.type_label ??
      (row.original.type ? TYPE_STRUCTURE_SANITAIRE_LABEL[row.original.type as TypeStructureSanitaire] : "—"),
  },
  { accessorKey: "ville", header: "Ville" },
  { accessorKey: "telephone", header: "Téléphone" },
];

const fields: CrudField[] = [
  { name: "nom", label: "Nom de la structure" },
  {
    name: "type",
    label: "Type",
    type: "select",
    options: TYPES_STRUCTURE_SANITAIRE.map((t) => ({
      label: TYPE_STRUCTURE_SANITAIRE_LABEL[t],
      value: t,
    })),
  },
  { name: "ville", label: "Ville" },
  { name: "telephone", label: "Téléphone" },
  { name: "adresse", label: "Adresse" },
  {
    name: "actif",
    label: "Structure agréée",
    type: "switch",
    help: "Désactivée, elle ne peut plus être choisie sur un nouveau dossier — les anciens la gardent.",
  },
];
</script>

<template>
  <BaseCrudManager
    cache-key="structures-sanitaires"
    title="Structures sanitaires"
    subtitle="Médecins, formations sanitaires, opticiens et pharmacies agréés"
    entity-label="Structure"
    searchable
    :repo="repo"
    :can-write="auth.can('gerer-affaires-sociales')"
    :can-delete="auth.can('gerer-affaires-sociales')"
    :columns="columns"
    :fields="fields"
    :schema="structureSanitaireInputSchema"
  />
</template>
