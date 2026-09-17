<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { ConventionStage } from "~/schemas/convention-stage";
import { agentNom } from "~/constants/carriere";

/**
 * Conventions de stage — l'entité, à distinguer de la vue dérivée
 * « Stagiaires » (des agents filtrés par type d'intégration).
 *
 * C'est ici que se joue la sortie du stage : prolongation, clôture,
 * attestation, et **conversion en agent** (D.4) qui ouvre un dossier
 * d'intégration « Recrutement externe » en brouillon — le wizard prend ensuite
 * le relais. Seul un stage clôturé est convertible ; un second appel renvoie 422.
 */
const api = useStagesApi();
const auth = useAuthStore();
const toast = useToast();
const handleError = useApiError();

const peutConvertir = computed(() => auth.can("gerer-formations") || auth.can("creer-recrutement"));
const peutGerer = computed(() => auth.can("creer-recrutement") || auth.can("modifier-contrats"));

const { data, pending, error, refresh } = useAsyncData("conventions-stage", () => api.list());
const stages = computed(() => data.value?.data ?? []);

const busy = ref(false);

async function executer(fn: () => Promise<unknown>, message: string) {
  busy.value = true;
  try {
    await fn();
    toast.add({ title: message, color: "success" });
    prolongationOpen.value = false;
    clotureOpen.value = false;
    await refresh();
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

// — Prolongation ————————————————————————————————————————————————
const prolongationOpen = ref(false);
const courant = ref<ConventionStage | null>(null);
const nouvelleFin = ref<string | undefined>(undefined);

function ouvrirProlongation(stage: ConventionStage) {
  courant.value = stage;
  nouvelleFin.value = stage.date_fin ?? undefined;
  prolongationOpen.value = true;
}

function prolonger() {
  if (!courant.value || !nouvelleFin.value) {
    toast.add({ title: "Nouvelle date de fin requise.", color: "error" });
    return;
  }
  executer(() => api.prolonger(courant.value!.id, { date_fin: nouvelleFin.value! }), "Stage prolongé");
}

// — Clôture ————————————————————————————————————————————————————
const clotureOpen = ref(false);
const note = ref<number | undefined>(undefined);
const appreciation = ref("");

function ouvrirCloture(stage: ConventionStage) {
  courant.value = stage;
  note.value = stage.note_finale ?? undefined;
  appreciation.value = stage.appreciation ?? "";
  clotureOpen.value = true;
}

function cloturer() {
  if (!courant.value) return;
  // Note et appréciation (10 caractères min.) sont toutes deux obligatoires.
  if (note.value == null || appreciation.value.trim().length < 10) {
    toast.add({ title: "Note et appréciation (10 caractères min.) sont requises.", color: "error" });
    return;
  }
  executer(
    () => api.cloturer(courant.value!.id, { note: note.value!, appreciation: appreciation.value.trim() }),
    "Stage clôturé",
  );
}

function convertir(stage: ConventionStage) {
  if (!confirm("Convertir ce stagiaire en agent ? Un dossier d'intégration sera ouvert en brouillon.")) return;
  executer(() => api.convertirAgent(stage.id), "Dossier d'intégration ouvert — à compléter dans le wizard");
}

async function telecharger(stage: ConventionStage) {
  busy.value = true;
  try {
    downloadBlob(await api.attestation(stage.id), `attestation-stage-${stage.id}.pdf`);
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

const columns: TableColumn<ConventionStage>[] = [
  {
    id: "agent",
    header: "Stagiaire",
    accessorFn: (s) => agentNom(s.agent),
    cell: ({ row }) => agentNom(row.original.agent),
  },
  { id: "etablissement", header: "Établissement" },
  { id: "periode", header: "Période" },
  { id: "statut", header: "Statut" },
  { id: "actions", header: "" },
];
</script>

<template>
  <BasePanel title="Conventions de stage" subtitle="Suivi, clôture et conversion en agent">
    <BaseDataState :pending="pending" :error="error">
      <BaseTable
        :data="stages"
        :columns="columns"
        searchable
        search-placeholder="Rechercher un stagiaire…"
        :page-size="10"
      >
        <template #empty>
          <p class="py-6 text-center text-sm text-muted">Aucune convention de stage</p>
        </template>
        <template #etablissement-cell="{ row }">
          <span class="text-sm">{{ row!.original.etablissement ?? "—" }}</span>
        </template>
        <template #periode-cell="{ row }">
          <span class="text-sm text-muted">
            {{ formatPeriode(row!.original.date_debut, row!.original.date_fin) }}
            <span v-if="row!.original.jours_avant_fin != null">
              · {{ row!.original.jours_avant_fin }} j restants
            </span>
          </span>
        </template>
        <template #statut-cell="{ row }">
          <UBadge
            :color="row!.original.statut_stage === 'TERMINE' ? 'success' : row!.original.statut_stage === 'ROMPU' ? 'error' : 'warning'"
            variant="subtle"
          >
            {{ row!.original.statut_stage_label ?? row!.original.statut_stage ?? "—" }}
          </UBadge>
        </template>
        <template #actions-cell="{ row }">
          <div class="flex justify-end gap-1">
            <UButton
              v-if="peutGerer && row!.original.statut_stage === 'EN_COURS'"
              size="xs"
              color="neutral"
              variant="soft"
              icon="i-lucide-calendar-plus"
              :loading="busy"
              @click="ouvrirProlongation(row!.original)"
            >
              Prolonger
            </UButton>
            <UButton
              v-if="peutGerer && row!.original.statut_stage === 'EN_COURS'"
              size="xs"
              variant="soft"
              icon="i-lucide-flag"
              :loading="busy"
              @click="ouvrirCloture(row!.original)"
            >
              Clôturer
            </UButton>
            <UButton
              v-if="row!.original.statut_stage === 'TERMINE'"
              size="xs"
              color="neutral"
              variant="ghost"
              icon="i-lucide-file-down"
              :loading="busy"
              @click="telecharger(row!.original)"
            />
            <UButton
              v-if="peutConvertir && row!.original.statut_stage === 'TERMINE'"
              size="xs"
              icon="i-lucide-user-plus"
              :loading="busy"
              @click="convertir(row!.original)"
            >
              Convertir en agent
            </UButton>
          </div>
        </template>
      </BaseTable>
    </BaseDataState>

    <UModal v-model:open="prolongationOpen" title="Prolonger le stage">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Nouvelle date de fin" name="date_fin" required>
            <UInput v-model="nouvelleFin" type="date" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="prolongationOpen = false">Annuler</UButton>
            <UButton :loading="busy" @click="prolonger">Prolonger</UButton>
          </div>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="clotureOpen" title="Clôturer le stage">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Note finale" name="note" required>
            <UInputNumber v-model="note" :min="0" :max="20" :step="0.5" class="w-full" />
          </UFormField>
          <UFormField label="Appréciation" name="appreciation" required help="10 caractères minimum.">
            <UTextarea v-model="appreciation" :rows="4" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="clotureOpen = false">Annuler</UButton>
            <UButton :loading="busy" @click="cloturer">Clôturer</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </BasePanel>
</template>
