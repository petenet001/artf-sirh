<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { CrudField } from "~/types/crud";
import { jourFerieInputSchema, type JourFerie } from "~/schemas/jour-ferie";
import { regleAcquisitionInputSchema, type RegleAcquisition } from "~/schemas/regle-acquisition";
import { palierAncienneteInputSchema, type PalierAnciennete } from "~/schemas/palier-anciennete";

/**
 * Paramétrage congés : jours fériés (calcul des jours ouvrables), règles
 * d'acquisition annuelle par type et paliers d'ancienneté (bonus ajouté au
 * solde, CCN art. 77). Écriture réservée à `valider-conges` ; lecture seule
 * sinon (les listes restent visibles à `consulter-conges`).
 */
const auth = useAuthStore();
const joursFeriesApi = useJoursFeriesApi();
const reglesApi = useReglesAcquisitionApi();
const paliersApi = usePaliersAncienneteApi();
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

// — Paliers d'ancienneté ——————————————————————————————————————————
const paliersColumns: TableColumn<PalierAnciennete>[] = [
  {
    id: "tranche",
    header: "Ancienneté",
    cell: ({ row }) =>
      row.original.anciennete_max == null
        ? `${row.original.anciennete_min} ans et plus`
        : `${row.original.anciennete_min} à ${row.original.anciennete_max} ans`,
  },
  { id: "jours_bonus", header: "Jours en plus", cell: ({ row }) => `+${row.original.jours_bonus}` },
];
const paliersFields: CrudField[] = [
  { name: "anciennete_min", label: "Ancienneté minimale (années)", type: "number", placeholder: "5" },
  {
    name: "anciennete_max",
    label: "Ancienneté maximale (années)",
    type: "number",
    placeholder: "9",
    help: "Laisser vide pour le dernier palier (sans plafond).",
  },
  { name: "jours_bonus", label: "Jours ajoutés au solde annuel", type: "number", placeholder: "6" },
];
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

    <BaseCrudManager
      cache-key="conges-paliers-anciennete"
      title="Paliers d'ancienneté"
      subtitle="Jours ajoutés au solde selon les années de service au 1er janvier"
      entity-label="Palier"
      :repo="paliersApi"
      :can-write="canWrite"
      :can-delete="canWrite"
      :columns="paliersColumns"
      :fields="paliersFields"
      :schema="palierAncienneteInputSchema"
    />
  </div>
</template>
