<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Reclamation } from "~/schemas/reclamation";
import { agentNom } from "~/constants/evaluations";

/**
 * File de travail RH : les fiches transmises en validation (art. 66) et les
 * réclamations en attente (art. 65). Les deux listes mènent à la fiche, où la
 * décision se prend avec tout le contexte sous les yeux.
 *
 * ⚠️ Écran réservé au rôle `rh` / `admin` : la permission `valider-evaluations`
 * est détenue par tous les chefs et ne peut pas servir de garde ici.
 */
const evaluationsApi = useEvaluationsApi();
const reclamationsApi = useReclamationsApi();

const { data: fichesData, pending, error } = useAsyncData("evaluations-validation-rh", () =>
  evaluationsApi.list({ statut: "en_validation_rh" }),
);
const fiches = computed(() => fichesData.value?.data ?? []);

const { data: reclamationsData, pending: pendingReclamations } = useAsyncData(
  "reclamations-en-attente",
  () => reclamationsApi.enAttente(),
);
const reclamations = computed(() => reclamationsData.value?.data ?? []);

const colonnesReclamations: TableColumn<Reclamation>[] = [
  {
    id: "agent",
    header: "Agent",
    accessorFn: (r) => agentNom(r.agent),
    cell: ({ row }) => agentNom(row.original.agent),
  },
  { id: "motif", header: "Motif" },
  {
    id: "depot",
    header: "Déposée le",
    cell: ({ row }) => formatDate(row.original.created_at),
  },
];
</script>

<template>
  <BasePanel title="Validation RH" subtitle="Fiches à valider et réclamations à trancher">
    <div class="space-y-6">
      <div class="rounded-xl border border-default bg-default p-5">
        <BaseCardTitle icon="i-lucide-shield-check" title="Fiches en validation" />
        <div class="mt-4">
          <BaseDataState :pending="pending" :error="error">
            <EvaluationsTable
              :evaluations="fiches"
              empty-label="Aucune fiche en attente de validation"
            />
          </BaseDataState>
        </div>
      </div>

      <div class="rounded-xl border border-default bg-default p-5">
        <BaseCardTitle icon="i-lucide-message-square-warning" title="Réclamations en attente" />
        <div class="mt-4">
          <BaseDataState :pending="pendingReclamations">
            <BaseTable
              :data="reclamations"
              :columns="colonnesReclamations"
              :page-size="10"
              :row-to="(r) => `/evaluations/fiches/${r.evaluation_id}`"
            >
              <template #empty>
                <p class="py-6 text-center text-sm text-muted">Aucune réclamation en attente</p>
              </template>
              <template #motif-cell="{ row }">
                <span class="line-clamp-2 text-sm text-default">{{ row!.original.motif }}</span>
              </template>
            </BaseTable>
          </BaseDataState>
        </div>
      </div>
    </div>
  </BasePanel>
</template>
