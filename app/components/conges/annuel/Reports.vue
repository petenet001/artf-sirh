<script setup lang="ts">
import type { FormSubmitEvent, TableColumn } from "@nuxt/ui";
import {
  reportCongeAnnuelInputSchema,
  type ReportCongeAnnuel,
  type ReportCongeAnnuelInput,
} from "~/schemas/conge-annuel";
import { STATUTS_REPORT_CONGE_ANNUEL } from "~/constants/enums";
import { agentNom } from "~/constants/conges";
import {
  PLAFOND_REPORT_JOURS,
  STATUT_REPORT_COLOR,
  STATUT_REPORT_LABEL,
  gereCongeAnnuel,
} from "~/constants/conges-annuels";

/**
 * Reports pour nécessité de service (`/conges-annuels/reports`).
 *
 * Le **N+1 propose** (l'API vérifie qu'il est bien le supérieur de l'agent :
 * 403 sinon), la **RH décide** (`rh` / `admin` seulement). L'agent ne voit pas
 * ce formulaire. Le report verse le reliquat de l'année source sur la
 * suivante, sans fixer de dates ; plafond {@link PLAFOND_REPORT_JOURS} j
 * ouvrables (422 au-delà).
 */
const auth = useAuthStore();
const api = useCongesAnnuelsApi().reports;
const agentsApi = useAgentsApi();
const toast = useToast();
const handleError = useApiError();

const decide = computed(() => gereCongeAnnuel(auth.hasRole));
const peutProposer = computed(() => auth.can("valider-conges") && auth.can("consulter-agents"));

const ALL = "__all__";
const statut = ref<string>(decide.value ? "propose" : ALL);
const statutItems = [
  { label: "Tous les statuts", value: ALL },
  ...STATUTS_REPORT_CONGE_ANNUEL.map((s) => ({ label: STATUT_REPORT_LABEL[s], value: s })),
];

const { data, pending, error, refresh } = useAsyncData(
  "conges-annuels-reports",
  () => api.list(statut.value === ALL ? undefined : { statut: statut.value }),
  { watch: [statut] },
);
const reports = computed(() => data.value?.data ?? []);

const busy = ref(false);

async function accorder(r: ReportCongeAnnuel) {
  if (!confirm(`Accorder le report de ${r.jours} j de ${r.annee_source} sur ${r.annee_cible} pour ${agentNom(r.agent)} ?`)) return;
  busy.value = true;
  try {
    await api.accorder(r.id);
    toast.add({ title: "Report accordé : reliquat versé sur l'année suivante", color: "success" });
    await refresh();
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

// — Refus (commentaire obligatoire) ————————————————————————————
const refusOpen = ref(false);
const refusCible = ref<ReportCongeAnnuel | null>(null);
const refusComment = ref("");

function ouvrirRefus(r: ReportCongeAnnuel) {
  refusCible.value = r;
  refusComment.value = "";
  refusOpen.value = true;
}

async function confirmerRefus() {
  if (!refusCible.value || refusComment.value.trim().length < 3) {
    toast.add({ title: "Motif requis (3 caractères min.).", color: "error" });
    return;
  }
  busy.value = true;
  try {
    await api.refuser(refusCible.value.id, { commentaire: refusComment.value.trim() });
    toast.add({ title: "Report refusé : le reliquat reste sur l'année source", color: "success" });
    refusOpen.value = false;
    await refresh();
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

// — Proposition (N+1) ———————————————————————————————————————————
const propositionOpen = ref(false);
const state = reactive<Partial<ReportCongeAnnuelInput>>({});

const { data: agentsData } = useAsyncData("reports-agents-select", () =>
  peutProposer.value ? agentsApi.list() : Promise.resolve(null),
);
const agentOptions = computed(() =>
  (agentsData.value?.data ?? []).map((a) => ({ label: agentNom(a), value: a.id })),
);

function ouvrirProposition() {
  state.agent_id = undefined;
  state.annee_source = new Date().getFullYear() - 1;
  state.motif = "Nécessité de service";
  propositionOpen.value = true;
}

async function proposer(event: FormSubmitEvent<ReportCongeAnnuelInput>) {
  busy.value = true;
  try {
    await api.proposer(event.data);
    toast.add({ title: "Report proposé à la RH", color: "success" });
    propositionOpen.value = false;
    await refresh();
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

const columns: TableColumn<ReportCongeAnnuel>[] = [
  { id: "agent", header: "Agent", accessorFn: (r) => agentNom(r.agent), cell: ({ row }) => agentNom(row.original.agent) },
  { id: "annees", header: "Report", cell: ({ row }) => `${row.original.annee_source} → ${row.original.annee_cible}` },
  { id: "jours", header: "Jours", cell: ({ row }) => `${row.original.jours} j` },
  { accessorKey: "motif", header: "Motif" },
  { id: "statut", header: "Statut" },
  { id: "actions", header: "" },
];
</script>

<template>
  <BaseDataState :pending="pending" :error="error">
    <BaseTable
      :data="reports"
      :columns="columns"
      searchable
      search-placeholder="Rechercher un agent…"
      :page-size="10"
      empty-label="Aucun report"
    >
      <template #filters>
        <USelect v-model="statut" :items="statutItems" class="w-44" />
      </template>
      <template #actions>
        <UButton v-if="peutProposer" icon="i-lucide-plus" @click="ouvrirProposition">Proposer un report</UButton>
      </template>
      <template #statut-cell="{ row }">
        <div class="space-y-1">
          <UBadge :color="STATUT_REPORT_COLOR[row!.original.statut]" variant="subtle">
            {{ row!.original.statut_label ?? STATUT_REPORT_LABEL[row!.original.statut] }}
          </UBadge>
          <p v-if="row!.original.commentaire_decision" class="text-xs text-muted">
            « {{ row!.original.commentaire_decision }} »
          </p>
        </div>
      </template>
      <template #actions-cell="{ row }">
        <div v-if="decide && row!.original.statut === 'propose'" class="flex justify-end gap-2">
          <UButton size="xs" icon="i-lucide-check" :loading="busy" @click="accorder(row!.original)">Accorder</UButton>
          <UButton size="xs" color="error" variant="soft" icon="i-lucide-x" :loading="busy" @click="ouvrirRefus(row!.original)">
            Refuser
          </UButton>
        </div>
      </template>
    </BaseTable>

    <UModal v-model:open="propositionOpen">
      <template #title>
        <BaseCardTitle icon="i-lucide-calendar-clock" title="Proposer un report pour nécessité de service" />
      </template>
      <template #body>
        <UForm :schema="reportCongeAnnuelInputSchema" :state="state" class="space-y-4" @submit="proposer">
          <UFormField label="Agent" name="agent_id" help="Vous devez être son supérieur hiérarchique (N+1).">
            <USelectMenu
              v-model="state.agent_id"
              value-key="value"
              :items="agentOptions"
              placeholder="Sélectionner un agent"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Année du reliquat"
            name="annee_source"
            :help="`Tout le reliquat est reporté sur l'année suivante (${PLAFOND_REPORT_JOURS} j ouvrables max.).`"
          >
            <UInputNumber v-model="state.annee_source" :min="2000" :max="2100" :format-options="{ useGrouping: false }" class="w-full" />
          </UFormField>
          <UFormField label="Motif" name="motif">
            <UTextarea v-model="state.motif" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-2 pt-2">
            <UButton color="neutral" variant="ghost" @click="propositionOpen = false">Annuler</UButton>
            <UButton type="submit" :loading="busy">Proposer</UButton>
          </div>
        </UForm>
      </template>
    </UModal>

    <UModal v-model:open="refusOpen" title="Refuser le report">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Motif du refus" name="commentaire" required>
            <UTextarea v-model="refusComment" placeholder="Expliquez le refus (3 caractères min.)" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="refusOpen = false">Annuler</UButton>
            <UButton color="error" :loading="busy" @click="confirmerRefus">Refuser</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </BaseDataState>
</template>
