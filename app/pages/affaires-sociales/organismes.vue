<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { CrudField } from "~/types/crud";
import { organismeSocialInputSchema, type OrganismeSocial } from "~/schemas/organisme-social";
import { TYPES_ORGANISME_SOCIAL } from "~/constants/enums";
import { TYPE_ORGANISME_LABEL, type TypeOrganismeSocial } from "~/constants/social";

/**
 * Organismes sociaux : CNSS, mutuelles, complémentaires.
 *
 * ⚠️ La CNSS est un organisme **système** : ni supprimable, ni modifiable dans
 * son type et son code (422). Un organisme déjà utilisé par une affiliation ne
 * se supprime pas non plus — le désactiver bloque les nouvelles affiliations.
 */
const repo = useOrganismesSociauxApi();
const auth = useAuthStore();

const columns: TableColumn<OrganismeSocial>[] = [
  { accessorKey: "nom", header: "Organisme" },
  {
    id: "type",
    header: "Type",
    accessorFn: (o) => (o.type ? TYPE_ORGANISME_LABEL[o.type as TypeOrganismeSocial] : "—"),
    cell: ({ row }) =>
      row.original.type_label ??
      (row.original.type ? TYPE_ORGANISME_LABEL[row.original.type as TypeOrganismeSocial] : "—"),
  },
  { accessorKey: "code", header: "Code" },
  { accessorKey: "telephone", header: "Téléphone" },
];

const fields: CrudField[] = [
  { name: "nom", label: "Nom de l'organisme" },
  {
    name: "type",
    label: "Type",
    type: "select",
    options: TYPES_ORGANISME_SOCIAL.map((t) => ({ label: TYPE_ORGANISME_LABEL[t], value: t })),
  },
  { name: "code", label: "Code", help: "Identifiant court (ex. CNSS). Non modifiable sur la CNSS." },
  { name: "telephone", label: "Téléphone" },
  { name: "email", label: "Adresse e-mail" },
  { name: "adresse", label: "Adresse" },
  { name: "description", label: "Description", type: "textarea" },
  { name: "actif", label: "Organisme actif", type: "switch", help: "Inactif = plus de nouvelle affiliation." },
];
</script>

<template>
  <BaseCrudManager
    cache-key="organismes-sociaux"
    title="Organismes sociaux"
    subtitle="CNSS, mutuelles et complémentaires"
    entity-label="Organisme"
    searchable
    :repo="repo"
    :can-write="auth.can('gerer-affaires-sociales')"
    :can-delete="auth.can('gerer-affaires-sociales')"
    :columns="columns"
    :fields="fields"
    :schema="organismeSocialInputSchema"
  />
</template>
