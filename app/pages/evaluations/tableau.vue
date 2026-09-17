<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Evaluation } from "~/schemas/evaluation";
import { agentNom } from "~/constants/evaluations";

/**
 * Tableau d'avancement et commissions d'une session (CCN art. 67–70).
 *
 * L'enchaînement est imposé par l'API et se lit de haut en bas :
 * fiches finalisées → inscription au tableau (D5) → commission préparatoire
 * (harmonisation + note de synthèse) → commission d'avancement (décision) →
 * application de l'échelon → clôture de la session.
 *
 * Écran RH / DG : `valider-evaluations` seul ne suffit pas (tous les chefs le
 * détiennent).
 */
const evaluationsApi = useEvaluationsApi();
const acteur = useActeurEvaluation();
const toast = useToast();
const handleError = useApiError();

const { sessions, pending: pendingSessions } = useSessionsEvaluation();

// Session courante : la plus récente encore ouverte, sinon la plus récente.
const sessionId = ref<number>(0);
watchEffect(() => {
  if (sessionId.value || !sessions.value.length) return;
  sessionId.value = (sessions.value.find((s) => s.statut === "ouverte") ?? sessions.value[0])!.id;
});

const sessionOptions = computed(() =>
  sessions.value.map((s) => ({
    label: s.description ?? `Session du ${formatDate(s.debut_session)}`,
    value: s.id,
  })),
);

// Fiches finalisées de la session : la source du tableau d'avancement.
const { data, pending, refresh } = useAsyncData(
  () => `session-finalisees-${sessionId.value}`,
  () =>
    sessionId.value > 0
      ? evaluationsApi.list({ session_id: sessionId.value, statut: "finalisee" })
      : Promise.resolve(null),
  { watch: [sessionId] },
);
const finalisees = computed(() => data.value?.data ?? []);
const inscrites = computed(() => finalisees.value.filter((e) => e.inscrit_tableau));

const busy = ref(false);

async function basculer(fiche: Evaluation) {
  busy.value = true;
  try {
    if (fiche.inscrit_tableau) await evaluationsApi.retirerTableau(fiche.id);
    else await evaluationsApi.inscrireTableau(fiche.id);
    toast.add({
      title: fiche.inscrit_tableau ? "Fiche retirée du tableau" : "Fiche inscrite au tableau",
      color: "success",
    });
    await refresh();
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

const peutGererTableau = computed(() => acteur.value.estRh && acteur.value.peutValider);

const columns: TableColumn<Evaluation>[] = [
  {
    id: "agent",
    header: "Agent",
    accessorFn: (e) => agentNom(e.agent),
    cell: ({ row }) => agentNom(row.original.agent),
  },
  { id: "note", header: "Note" },
  { id: "tableau", header: "Tableau" },
  { id: "actions", header: "" },
];
</script>

<template>
  <BasePanel title="Tableau & commissions" subtitle="Avancement d'échelon : du tableau à l'application">
    <BaseDataState :pending="pendingSessions">
      <div class="space-y-6">
        <div class="flex flex-wrap items-center gap-3">
          <USelect
            v-model="sessionId"
            :items="sessionOptions"
            value-key="value"
            placeholder="Choisir une session"
            class="w-72"
          />
          <p v-if="finalisees.length" class="text-sm text-muted">
            {{ inscrites.length }} fiche(s) inscrite(s) au tableau sur {{ finalisees.length }} finalisée(s).
          </p>
        </div>

        <!-- 1. Tableau d'avancement (D5) -->
        <div class="rounded-xl border border-default bg-default p-5">
          <BaseCardTitle icon="i-lucide-list-checks" title="Tableau d'avancement" />
          <p class="mt-2 text-xs text-muted">
            Une fiche validée est inscrite d'office. Le retrait n'est plus possible une fois qu'une
            décision de commission a été posée.
          </p>
          <div class="mt-4">
            <BaseDataState :pending="pending">
              <BaseTable :data="finalisees" :columns="columns" :bordered="false" :page-size="10" searchable>
                <template #empty>
                  <p class="py-6 text-center text-sm text-muted">Aucune fiche finalisée dans cette session</p>
                </template>
                <template #note-cell="{ row }">
                  <EvaluationsMentionBadge :note="row!.original.note_globale" :mention="row!.original.mention" />
                </template>
                <template #tableau-cell="{ row }">
                  <UBadge :color="row!.original.inscrit_tableau ? 'success' : 'neutral'" variant="subtle" size="sm">
                    {{ row!.original.inscrit_tableau ? "Inscrite" : "Retirée" }}
                  </UBadge>
                </template>
                <template #actions-cell="{ row }">
                  <div class="flex justify-end gap-2">
                    <UButton
                      size="xs"
                      color="neutral"
                      variant="ghost"
                      icon="i-lucide-eye"
                      :to="`/evaluations/fiches/${row!.original.id}`"
                    />
                    <UButton
                      v-if="peutGererTableau && !row!.original.commission_decision"
                      size="xs"
                      color="neutral"
                      variant="soft"
                      :icon="row!.original.inscrit_tableau ? 'i-lucide-list-minus' : 'i-lucide-list-plus'"
                      :loading="busy"
                      @click="basculer(row!.original)"
                    >
                      {{ row!.original.inscrit_tableau ? "Retirer" : "Inscrire" }}
                    </UButton>
                  </div>
                </template>
              </BaseTable>
            </BaseDataState>
          </div>
        </div>

        <!-- 2. Commission préparatoire (art. 68) -->
        <div v-if="sessionId" class="rounded-xl border border-default bg-default p-5">
          <EvaluationsCommissionPreparatoire :session-id="sessionId" :fiches="inscrites" @changed="refresh" />
        </div>

        <!-- 3. Commission d'avancement (art. 69–70) -->
        <div v-if="sessionId" class="rounded-xl border border-default bg-default p-5">
          <EvaluationsCommissionAvancement :session-id="sessionId" :fiches="inscrites" @changed="refresh" />
        </div>
      </div>
    </BaseDataState>
  </BasePanel>
</template>
