<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Evaluation } from "~/schemas/evaluation";
import {
  agentNom,
  ECART_COMMISSION_ALERTE,
  STATUT_COMMISSION_COLOR,
  STATUT_COMMISSION_LABEL,
  type StatutCommission,
} from "~/constants/evaluations";

/**
 * Commission préparatoire (CCN art. 68) : elle harmonise les notes des fiches
 * inscrites au tableau et rédige la note de synthèse (art. 67).
 *
 * Un écart de plus de 5 points entre la note harmonisée et celle du N+1 est
 * signalé — indicatif, jamais bloquant. La note de synthèse PDF n'est éditable
 * qu'après la clôture, et réservée RH / admin / DG (403 sinon).
 */
const props = defineProps<{ sessionId: number; fiches: Evaluation[] }>();
const emit = defineEmits<{ changed: [] }>();

const api = useCommissionsApi();
const acteur = useActeurEvaluation();
const toast = useToast();
const handleError = useApiError();

const peutAgir = computed(() => acteur.value.peutValider && (acteur.value.estRh || !!acteur.value.estDg));

const { data, pending, refresh } = useAsyncData(
  () => `commission-preparatoire-${props.sessionId}`,
  () => (props.sessionId > 0 ? api.preparatoireParSession(props.sessionId) : Promise.resolve(null)),
  { watch: [() => props.sessionId] },
);
const commission = computed(() => data.value?.data ?? null);
const ouverte = computed(() => commission.value?.statut === "en_cours");
const cloturee = computed(() => commission.value?.statut === "cloturee");

const busy = ref(false);

async function executer(fn: () => Promise<unknown>, message: string) {
  busy.value = true;
  try {
    await fn();
    toast.add({ title: message, color: "success" });
    await refresh();
    emit("changed");
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

function ouvrir() {
  executer(() => api.ouvrirPreparatoire(props.sessionId), "Commission préparatoire ouverte");
}

function cloturer() {
  if (!confirm("Clôturer la commission préparatoire ? Les notes ne seront plus harmonisables.")) return;
  executer(() => api.cloturerPreparatoire(commission.value!.id), "Commission préparatoire clôturée");
}

async function telechargerSynthese() {
  busy.value = true;
  try {
    downloadBlob(await api.synthesePdf(commission.value!.id), `note-synthese-session-${props.sessionId}.pdf`);
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

// — Harmonisation d'une fiche ————————————————————————————————
const open = ref(false);
const courante = ref<Evaluation | null>(null);
const note = ref<number | undefined>(undefined);
const synthese = ref("");

function ouvrirNotation(fiche: Evaluation) {
  courante.value = fiche;
  note.value = fiche.commission_note ?? fiche.note_globale ?? undefined;
  synthese.value = fiche.note_synthese ?? "";
  open.value = true;
}

async function enregistrerNote() {
  const fiche = courante.value;
  if (!fiche || note.value == null) {
    toast.add({ title: "Note requise (0 à 20).", color: "error" });
    return;
  }
  busy.value = true;
  try {
    const { data: resultat } = await api.noterPreparatoire(commission.value!.id, {
      evaluation_id: fiche.id,
      commission_note: note.value,
      note_synthese: synthese.value.trim() || null,
    });
    toast.add({
      title: resultat.message ?? "Note harmonisée enregistrée",
      description: resultat.alerte_ecart
        ? `Écart de ${resultat.ecart} point(s) avec la note du notateur.`
        : undefined,
      color: resultat.alerte_ecart ? "warning" : "success",
    });
    open.value = false;
    emit("changed");
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

/** Écart entre note harmonisée et note du notateur, pour la colonne d'alerte. */
function ecart(fiche: Evaluation): number | null {
  if (fiche.commission_note == null || fiche.note_globale == null) return null;
  return Math.abs(fiche.commission_note - fiche.note_globale);
}

const columns: TableColumn<Evaluation>[] = [
  {
    id: "agent",
    header: "Agent",
    accessorFn: (e) => agentNom(e.agent),
    cell: ({ row }) => agentNom(row.original.agent),
  },
  { id: "note_n1", header: "Note N+1" },
  { id: "note_commission", header: "Note commission" },
  { id: "actions", header: "" },
];
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <BaseCardTitle icon="i-lucide-users" title="Commission préparatoire (art. 68)" />
      <div class="flex items-center gap-2">
        <UBadge
          v-if="commission"
          :color="STATUT_COMMISSION_COLOR[commission.statut as StatutCommission] ?? 'neutral'"
          variant="subtle"
        >
          {{ commission.statut_label ?? STATUT_COMMISSION_LABEL[commission.statut as StatutCommission] }}
        </UBadge>
        <UButton
          v-if="peutAgir && !commission"
          size="xs"
          icon="i-lucide-play"
          :loading="busy"
          @click="ouvrir"
        >
          Ouvrir la commission
        </UButton>
        <UButton v-if="peutAgir && ouverte" size="xs" icon="i-lucide-lock" :loading="busy" @click="cloturer">
          Clôturer
        </UButton>
        <UButton
          v-if="cloturee"
          size="xs"
          color="neutral"
          variant="soft"
          icon="i-lucide-file-down"
          :loading="busy"
          @click="telechargerSynthese"
        >
          Note de synthèse
        </UButton>
      </div>
    </div>

    <div v-if="pending" class="mt-4 text-sm text-muted">Chargement…</div>

    <p v-else-if="!commission" class="mt-4 text-sm text-muted">
      Aucune commission préparatoire ouverte pour cette session. Elle harmonise les notes des fiches
      finalisées avant la commission d'avancement.
    </p>

    <div v-else class="mt-4">
      <BaseTable :data="fiches" :columns="columns" :bordered="false" :page-size="10">
        <template #empty>
          <p class="py-6 text-center text-sm text-muted">Aucune fiche inscrite au tableau</p>
        </template>
        <template #note_n1-cell="{ row }">
          <EvaluationsMentionBadge :note="row!.original.note_globale" :mention="row!.original.mention" />
        </template>
        <template #note_commission-cell="{ row }">
          <span v-if="row!.original.commission_note != null" class="inline-flex items-center gap-2">
            <span class="text-sm font-semibold text-highlighted">{{ row!.original.commission_note }}/20</span>
            <UBadge
              v-if="(ecart(row!.original) ?? 0) > ECART_COMMISSION_ALERTE"
              color="warning"
              variant="subtle"
              size="sm"
            >
              Écart {{ ecart(row!.original) }}
            </UBadge>
          </span>
          <span v-else class="text-sm text-muted">—</span>
        </template>
        <template #actions-cell="{ row }">
          <UButton
            v-if="peutAgir && ouverte"
            size="xs"
            color="neutral"
            variant="soft"
            icon="i-lucide-scale"
            @click="ouvrirNotation(row!.original)"
          >
            Harmoniser
          </UButton>
        </template>
      </BaseTable>
    </div>

    <UModal v-model:open="open" title="Harmoniser la note">
      <template #body>
        <div class="space-y-4">
          <p v-if="courante" class="text-sm text-muted">
            {{ agentNom(courante.agent) }} — note du notateur :
            {{ courante.note_globale != null ? `${courante.note_globale}/20` : "non notée" }}
          </p>
          <UFormField label="Note de la commission" name="commission_note" required>
            <UInputNumber v-model="note" :min="0" :max="20" :step="0.25" class="w-full" />
          </UFormField>
          <UFormField label="Note de synthèse (art. 67)" name="note_synthese">
            <UTextarea v-model="synthese" :rows="5" placeholder="Appréciation narrative" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
            <UButton :loading="busy" @click="enregistrerNote">Enregistrer</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
