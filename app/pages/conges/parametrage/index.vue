<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { CrudField } from "~/types/crud";
import { jourFerieInputSchema, type JourFerie } from "~/schemas/jour-ferie";
import { regleAcquisitionInputSchema, type RegleAcquisition } from "~/schemas/regle-acquisition";

/**
 * Paramétrage congés : jours fériés (calcul des jours ouvrables) et règles
 * d'acquisition annuelle par type. Écriture réservée à `valider-conges` ;
 * lecture seule sinon (les listes restent visibles à `consulter-conges`).
 */
const auth = useAuthStore();
const joursFeriesApi = useJoursFeriesApi();
const reglesApi = useReglesAcquisitionApi();
const typesCongesApi = useTypesCongesApi();

const canWrite = computed(() => auth.can("valider-conges"));

// Options de types de congé pour la règle d'acquisition.
const { options: typeOptions, labelById } = useResourceOptions("regles-types-conges", () => typesCongesApi.list());

// — Jours fériés ————————————————————————————————————————————————
const joursColumns: TableColumn<JourFerie>[] = [
  { accessorKey: "nom", header: "Nom" },
  dateColumn<JourFerie>("date", "Date"),
  { id: "recurrent", header: "Récurrent", accessorFn: (j) => (j.recurrent ? "Oui" : "Non") },
];
const joursFields: CrudField[] = [
  { name: "nom", label: "Nom" },
  { name: "date", label: "Date", type: "date" },
  { name: "recurrent", label: "Récurrent chaque année", type: "switch", help: "Se répète le même mois/jour." },
];

// — Règles d'acquisition ————————————————————————————————————————
const reglesColumns: TableColumn<RegleAcquisition>[] = [
  {
    id: "type",
    header: "Type de congé",
    cell: ({ row }) => row.original.type_conge?.nom ?? labelById.value[row.original.type_conge_id] ?? `#${row.original.type_conge_id}`,
  },
  { accessorKey: "jours_par_mois", header: "Jours / mois" },
  { accessorKey: "jours_max", header: "Plafond annuel" },
];
const reglesFields = computed<CrudField[]>(() => [
  { name: "type_conge_id", label: "Type de congé", type: "select", options: typeOptions.value },
  { name: "jours_par_mois", label: "Jours acquis par mois", type: "number", placeholder: "2.5" },
  { name: "jours_max", label: "Plafond annuel", type: "number", placeholder: "30" },
]);
</script>

<template>
  <div class="space-y-8">
    <BaseCrudManager
      cache-key="conges-jours-feries"
      title="Jours fériés"
      subtitle="Exclus du calcul des jours ouvrables"
      entity-label="Jour férié"
      :repo="joursFeriesApi"
      :can-write="canWrite"
      :can-delete="canWrite"
      :columns="joursColumns"
      :fields="joursFields"
      :schema="jourFerieInputSchema"
    />

    <BaseCrudManager
      cache-key="conges-regles-acquisition"
      title="Règles d'acquisition"
      subtitle="Droits acquis par type et par mois"
      entity-label="Règle d'acquisition"
      :repo="reglesApi"
      :can-write="canWrite"
      :can-delete="canWrite"
      :columns="reglesColumns"
      :fields="reglesFields"
      :schema="regleAcquisitionInputSchema"
    />
  </div>
</template>
