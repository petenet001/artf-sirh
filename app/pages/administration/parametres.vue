<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { CrudField } from "~/types/crud";
import {
  parametreApplicationInputSchema,
  type ParametreApplication,
} from "~/schemas/parametre-application";

/**
 * Paramètres applicatifs (note FE §2k.3, ligne « Audit / paramètres app »).
 *
 * Réservé au rôle `admin`, comme le journal d'audit : ces valeurs pilotent le
 * comportement de l'application, pas des données métier. La RH, qui administre
 * pourtant tout le reste, n'y touche pas.
 *
 * ⚠️ Ce sont des couples **clé / valeur** en texte libre. Renommer une clé
 * revient à en créer une autre : le code qui la lisait ne la trouvera plus, et
 * rien ne préviendra. L'écran le dit ; il ne peut pas l'empêcher.
 */
const repo = useParametresApplicationApi();
const auth = useAuthStore();

const estAdmin = computed(() => auth.hasRole("admin"));

const columns: TableColumn<ParametreApplication>[] = [
  { accessorKey: "cle", header: "Clé" },
  { accessorKey: "valeur", header: "Valeur" },
  { accessorKey: "description", header: "Description" },
];

const fields: CrudField[] = [
  {
    name: "cle",
    label: "Clé",
    help: "Identifiant technique lu par le code. Le renommer revient à créer un autre paramètre.",
  },
  { name: "valeur", label: "Valeur" },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    help: "À quoi sert ce paramètre, et ce qu'une valeur incorrecte provoquerait.",
  },
];
</script>

<template>
  <BaseCrudManager
    cache-key="parametres-application"
    title="Paramètres de l'application"
    subtitle="Réglages techniques — réservés à l'administrateur"
    entity-label="Paramètre"
    searchable
    :repo="repo"
    :can-write="estAdmin"
    :can-delete="estAdmin"
    :columns="columns"
    :fields="fields"
    :schema="parametreApplicationInputSchema"
  />
</template>
