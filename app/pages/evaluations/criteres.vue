<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { CrudField } from "~/types/crud";
import { questionEvaluationInputSchema, type QuestionEvaluation } from "~/schemas/question-evaluation";
import { CRITERE_LABEL, CRITERES_ORDRE, CRITERE_TOTAL, type TypeCritereEvaluation } from "~/constants/evaluations";

/**
 * Grille de critères de notation (CCN art. 63). Paramétrage **métier RH** —
 * d'où sa place dans le module Évaluations plutôt que dans les référentiels
 * d'administration.
 *
 * ⚠️ Supprimer un critère efface les notes déjà saisies : pour le retirer des
 * notations à venir sans toucher à l'historique, le passer à « inactif ».
 */
const repo = useQuestionsEvaluationApi();
const auth = useAuthStore();

const columns: TableColumn<QuestionEvaluation>[] = [
  { accessorKey: "libelle", header: "Critère" },
  {
    id: "type_critere",
    header: "Famille",
    accessorFn: (q) => CRITERE_LABEL[q.type_critere],
    cell: ({ row }) => CRITERE_LABEL[row.original.type_critere],
  },
  { accessorKey: "bareme_max", header: "Barème" },
  { accessorKey: "ordre", header: "Ordre" },
];

const fields: CrudField[] = [
  { name: "libelle", label: "Libellé du critère" },
  {
    name: "type_critere",
    label: "Famille",
    type: "select",
    options: CRITERES_ORDRE.map((c) => ({
      label: `${CRITERE_LABEL[c]} (total ${CRITERE_TOTAL[c as TypeCritereEvaluation]} pts)`,
      value: c,
    })),
  },
  { name: "bareme_max", label: "Barème maximum", type: "number", help: "Points de ce critère (0,5 à 20)." },
  { name: "ordre", label: "Ordre d'affichage", type: "number" },
  { name: "actif", label: "Critère actif", type: "switch", help: "Inactif = retiré des futures notations, notes conservées." },
];
</script>

<template>
  <BaseCrudManager
    cache-key="questions-evaluation"
    title="Grille de critères"
    subtitle="Barème de la notation — 10 pts compétence, 3 pts assiduité, 7 pts relations sociales"
    entity-label="Critère"
    :repo="repo"
    :can-write="auth.can('creer-evaluations')"
    :can-delete="auth.can('creer-evaluations')"
    :columns="columns"
    :fields="fields"
    :schema="questionEvaluationInputSchema"
  />
</template>
