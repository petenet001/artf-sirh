<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { SessionEvaluation } from "~/schemas/session-evaluation";
import { STATUTS_SESSION_EVALUATION } from "~/constants/enums";
import { STATUT_SESSION_LABEL } from "~/constants/evaluations";

/**
 * Sessions d'évaluation (vue RH). Ouvrir une session génère les fiches des
 * agents éligibles : c'est l'acte qui lance le cycle de notation.
 */
const auth = useAuthStore();
const { sessions, filters, pending, error, refresh } = useSessionsEvaluation();

const peutCreer = computed(() => auth.can("creer-evaluations"));
const modalOpen = ref(false);

const ALL = "__all__";
const statutItems = [
  { label: "Tous les statuts", value: ALL },
  ...STATUTS_SESSION_EVALUATION.map((s) => ({ label: STATUT_SESSION_LABEL[s], value: s })),
];
const statut = ref<string>(ALL);
// Filtre serveur (égalité exacte) : on efface la clé plutôt que d'envoyer une sentinelle.
watch(statut, (v) => {
  if (v === ALL) delete filters.statut;
  else filters.statut = v;
});

const columns: TableColumn<SessionEvaluation>[] = [
  {
    id: "session",
    header: "Session",
    accessorFn: (s) => s.description ?? formatDate(s.debut_session),
    cell: ({ row }) => row.original.description ?? formatDate(row.original.debut_session),
  },
  {
    id: "periode",
    header: "Période",
    cell: ({ row }) => formatPeriode(row.original.debut_session, row.original.fin_session),
  },
  { id: "cible", header: "Population visée" },
  { id: "fiches", header: "Fiches" },
  { id: "statut", header: "Statut" },
];

/** Résumé lisible des filtres d'éligibilité de la session (art. 62). */
function cible(s: SessionEvaluation): string {
  const parts: string[] = [];
  if (s.type_annee) parts.push(`embauche année ${s.type_annee}`);
  if (s.semestre) parts.push(`${s.semestre === 1 ? "1ᵉʳ" : "2ᵉ"} semestre`);
  return parts.length ? parts.join(" · ") : "Tous les agents éligibles";
}
</script>

<template>
  <BasePanel title="Sessions d'évaluation" subtitle="Cycles de notation et génération des fiches">
    <BaseDataState :pending="pending" :error="error">
      <BaseTable
        :data="sessions"
        :columns="columns"
        :page-size="10"
        :row-to="(s) => `/evaluations/sessions/${s.id}`"
      >
        <template #filters>
          <USelect v-model="statut" :items="statutItems" class="w-48" />
        </template>
        <template #actions>
          <UButton v-if="peutCreer" icon="i-lucide-plus" @click="modalOpen = true">Ouvrir une session</UButton>
        </template>
        <template #empty>
          <p class="py-6 text-center text-sm text-muted">Aucune session</p>
        </template>
        <template #cible-cell="{ row }">
          <span class="text-sm text-muted">{{ cible(row!.original) }}</span>
        </template>
        <template #fiches-cell="{ row }">
          <span class="text-sm">
            {{ row!.original.nb_fiches_total ?? "—" }}
            <span v-if="row!.original.nb_fiches_finalisees != null" class="text-muted">
              ({{ row!.original.nb_fiches_finalisees }} finalisées)
            </span>
          </span>
        </template>
        <template #statut-cell="{ row }">
          <EvaluationsStatutSessionBadge :statut="row!.original.statut" :label="row!.original.statut_label" />
        </template>
      </BaseTable>
    </BaseDataState>

    <EvaluationsSessionModal v-model:open="modalOpen" @saved="refresh" />
  </BasePanel>
</template>
