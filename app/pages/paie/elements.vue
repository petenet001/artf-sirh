<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { CrudField } from "~/types/crud";
import type { PaieElement, PaieElementInput } from "~/schemas/paie-element";
import { paieElementInputSchema } from "~/schemas/paie-element";
import {
  MODES_CALCUL_PAIE_ELEMENT,
  NATURES_PAIE_ELEMENT,
  PERIODICITES_PAIE_ELEMENT,
} from "~/constants/enums";
import {
  formatMontant,
  MODE_CALCUL_PAIE_LABEL,
  NATURE_PAIE_LABEL,
  PERIODICITE_PAIE_LABEL,
  type NaturePaieElement,
} from "~/constants/paie";

/**
 * Référentiel des éléments de paie (CCN art. 54–59).
 *
 * Les éléments **système** portent un code conventionnel : ni suppression, ni
 * changement de code, nature ou mode de calcul (422). Ce qui se paramètre
 * vraiment, ce sont les montants et taux que le comité de direction fixe —
 * `a_parametrer` signale ceux qui manquent encore. Tant qu'ils manquent, la
 * prime correspondante n'entre pas dans le lot.
 */
const paie = usePaieApi();
const auth = useAuthStore();

/** Adapte le repository Paie au contrat attendu par `BaseCrudManager`. */
const repo = {
  list: (params?: Record<string, string | number | boolean | undefined>) => paie.elements(params),
  create: (payload: PaieElementInput) => paie.creerElement(payload),
  update: (id: number, payload: Partial<PaieElementInput>) => paie.modifierElement(id, payload),
  remove: (id: number) => paie.supprimerElement(id),
};

const columns: TableColumn<PaieElement>[] = [
  { accessorKey: "libelle", header: "Élément" },
  {
    id: "nature",
    header: "Nature",
    accessorFn: (e) => (e.nature ? NATURE_PAIE_LABEL[e.nature as NaturePaieElement] : "—"),
    cell: ({ row }) =>
      row.original.nature_label ??
      (row.original.nature ? NATURE_PAIE_LABEL[row.original.nature as NaturePaieElement] : "—"),
  },
  { id: "montant", header: "Montant / taux" },
  { id: "origine", header: "Origine" },
];

const fields: CrudField[] = [
  { name: "code", label: "Code", help: "Minuscules et tirets bas. Un code conventionnel est refusé." },
  { name: "libelle", label: "Libellé" },
  {
    name: "nature",
    label: "Nature",
    type: "select",
    options: NATURES_PAIE_ELEMENT.map((n) => ({ label: NATURE_PAIE_LABEL[n], value: n })),
    help: "Le sens (gain ou retenue) en découle automatiquement.",
  },
  {
    name: "periodicite",
    label: "Périodicité",
    type: "select",
    options: PERIODICITES_PAIE_ELEMENT.map((p) => ({ label: PERIODICITE_PAIE_LABEL[p], value: p })),
  },
  {
    name: "mode_calcul",
    label: "Mode de calcul",
    type: "select",
    options: MODES_CALCUL_PAIE_ELEMENT.map((m) => ({ label: MODE_CALCUL_PAIE_LABEL[m], value: m })),
  },
  { name: "montant_defaut", label: "Montant par défaut", type: "number" },
  { name: "taux_defaut", label: "Taux par défaut (%)", type: "number" },
  { name: "article_ccn", label: "Article CCN" },
  { name: "actif", label: "Élément actif", type: "switch" },
];
</script>

<template>
  <BaseCrudManager
    cache-key="paie-elements"
    title="Éléments de paie"
    subtitle="Primes, indemnités, allocations et retenues (art. 54–59)"
    entity-label="Élément de paie"
    searchable
    :repo="repo"
    :can-write="auth.can('gerer-salaires')"
    :can-delete="auth.can('gerer-salaires')"
    :columns="columns"
    :fields="fields"
    :schema="paieElementInputSchema"
  >
    <template #montant-cell="{ row }">
      <span v-if="row!.original.montant_defaut != null" class="text-sm">
        {{ formatMontant(row!.original.montant_defaut) }}
      </span>
      <span v-else-if="row!.original.taux_defaut != null" class="text-sm">
        {{ row!.original.taux_defaut }} %
      </span>
      <UBadge v-else-if="row!.original.a_parametrer" color="warning" variant="subtle" size="sm">
        À paramétrer
      </UBadge>
      <span v-else class="text-sm text-muted">—</span>
    </template>
    <template #origine-cell="{ row }">
      <UBadge :color="row!.original.systeme ? 'primary' : 'neutral'" variant="outline" size="sm">
        {{ row!.original.systeme ? `CCN ${row!.original.article_ccn ?? ""}`.trim() : "Maison" }}
      </UBadge>
    </template>
  </BaseCrudManager>
</template>
