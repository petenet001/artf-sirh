<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Evaluation } from "~/schemas/evaluation";
import {
  agentNom,
  DECISION_COMMISSION_COLOR,
  DECISION_COMMISSION_LABEL,
  STATUT_COMMISSION_COLOR,
  STATUT_COMMISSION_LABEL,
  type DecisionCommission,
  type StatutCommission,
} from "~/constants/evaluations";
import { DECISIONS_COMMISSION } from "~/constants/enums";

/**
 * Commission d'avancement (CCN art. 69–70) : elle tranche fiche par fiche, puis
 * la RH applique l'échelon en paie.
 *
 * Contraintes portées par l'API : la commission ne s'ouvre qu'une fois la
 * préparatoire clôturée (422 sinon) ; `decider` refuse une fiche retirée du
 * tableau ; `avancer-echelon` est idempotent et n'accepte qu'une décision
 * favorable.
 */
const props = defineProps<{ sessionId: number; fiches: Evaluation[] }>();
const emit = defineEmits<{ changed: [] }>();

const api = useCommissionsApi();
const acteur = useActeurEvaluation();
const toast = useToast();
const handleError = useApiError();

const peutAgir = computed(() => acteur.value.peutValider && (acteur.value.estRh || !!acteur.value.estDg));
const peutAppliquer = computed(() => acteur.value.peutValider && acteur.value.estRh);

const { data, pending, refresh } = useAsyncData(
  () => `commission-avancement-${props.sessionId}`,
  () => (props.sessionId > 0 ? api.avancementParSession(props.sessionId) : Promise.resolve(null)),
  { watch: [() => props.sessionId] },
);
const commission = computed(() => data.value?.data ?? null);
const ouverte = computed(() => commission.value?.statut === "en_cours");

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
  executer(() => api.ouvrirAvancement(props.sessionId), "Commission d'avancement ouverte");
}

function cloturer() {
  if (!confirm("Clôturer la commission d'avancement ? Les décisions seront définitives.")) return;
  executer(() => api.cloturerAvancement(commission.value!.id), "Commission d'avancement clôturée");
}

async function appliquer(fiche: Evaluation) {
  busy.value = true;
  try {
    const { data: resultat } = await api.avancerEchelon(fiche.id);
    toast.add({
      title: resultat.message ?? "Échelon appliqué",
      color: resultat.avance ? "success" : "neutral",
    });
    emit("changed");
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

// — Décision par fiche ————————————————————————————————————————
const open = ref(false);
const courante = ref<Evaluation | null>(null);
const decision = ref<DecisionCommission>("favorable");
const echelons = ref<number>(1);
const noteAvancement = ref<number | undefined>(undefined);
const commentaire = ref("");

const decisionOptions = DECISIONS_COMMISSION.map((d) => ({ label: DECISION_COMMISSION_LABEL[d], value: d }));

function ouvrirDecision(fiche: Evaluation) {
  courante.value = fiche;
  decision.value = fiche.commission_decision ?? "favorable";
  echelons.value = fiche.nombre_echelons ?? 1;
  noteAvancement.value = fiche.note_avancement ?? fiche.commission_note ?? fiche.note_globale ?? undefined;
  commentaire.value = "";
  open.value = true;
}

// Une décision favorable ouvre droit à 1 ou 2 échelons ; sinon 0 (422 sinon).
watch(decision, (d) => {
  echelons.value = d === "favorable" ? Math.max(1, echelons.value) : 0;
});

async function enregistrerDecision() {
  const fiche = courante.value;
  if (!fiche) return;
  busy.value = true;
  try {
    await api.decider(commission.value!.id, {
      evaluation_id: fiche.id,
      decision: decision.value,
      nombre_echelons: decision.value === "favorable" ? echelons.value : 0,
      note_avancement: noteAvancement.value ?? null,
      commentaire: commentaire.value.trim() || null,
    });
    toast.add({ title: "Décision enregistrée", color: "success" });
    open.value = false;
    emit("changed");
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

const columns: TableColumn<Evaluation>[] = [
  {
    id: "agent",
    header: "Agent",
    accessorFn: (e) => agentNom(e.agent),
    cell: ({ row }) => agentNom(row.original.agent),
  },
  { id: "note", header: "Note retenue" },
  { id: "decision", header: "Décision" },
  { id: "actions", header: "" },
];
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <BaseCardTitle icon="i-lucide-gavel" title="Commission d'avancement (art. 69–70)" />
      <div class="flex items-center gap-2">
        <UBadge
          v-if="commission"
          :color="STATUT_COMMISSION_COLOR[commission.statut as StatutCommission] ?? 'neutral'"
          variant="subtle"
        >
          {{ commission.statut_label ?? STATUT_COMMISSION_LABEL[commission.statut as StatutCommission] }}
        </UBadge>
        <UButton v-if="peutAgir && !commission" size="xs" icon="i-lucide-play" :loading="busy" @click="ouvrir">
          Ouvrir la commission
        </UButton>
        <UButton v-if="peutAgir && ouverte" size="xs" icon="i-lucide-lock" :loading="busy" @click="cloturer">
          Clôturer
        </UButton>
      </div>
    </div>

    <div v-if="pending" class="mt-4 text-sm text-muted">Chargement…</div>

    <p v-else-if="!commission" class="mt-4 text-sm text-muted">
      Aucune commission d'avancement ouverte. Elle exige que la commission préparatoire soit
      clôturée au préalable.
    </p>

    <div v-else class="mt-4">
      <BaseTable :data="fiches" :columns="columns" :bordered="false" :page-size="10">
        <template #empty>
          <p class="py-6 text-center text-sm text-muted">Aucune fiche inscrite au tableau</p>
        </template>
        <template #note-cell="{ row }">
          <span class="text-sm">
            {{ row!.original.note_avancement ?? row!.original.commission_note ?? row!.original.note_globale ?? "—" }}
          </span>
        </template>
        <template #decision-cell="{ row }">
          <div v-if="row!.original.commission_decision" class="flex items-center gap-2">
            <UBadge
              :color="DECISION_COMMISSION_COLOR[row!.original.commission_decision as DecisionCommission] ?? 'neutral'"
              variant="subtle"
            >
              {{ row!.original.commission_decision_label ?? DECISION_COMMISSION_LABEL[row!.original.commission_decision as DecisionCommission] }}
            </UBadge>
            <span v-if="row!.original.nombre_echelons" class="text-xs text-muted">
              +{{ row!.original.nombre_echelons }} échelon(s)
            </span>
            <UBadge v-if="row!.original.echelon_avance" color="success" variant="outline" size="sm">Appliqué</UBadge>
          </div>
          <span v-else class="text-sm text-muted">En attente</span>
        </template>
        <template #actions-cell="{ row }">
          <div class="flex justify-end gap-2">
            <UButton
              v-if="peutAgir && ouverte"
              size="xs"
              color="neutral"
              variant="soft"
              icon="i-lucide-gavel"
              @click="ouvrirDecision(row!.original)"
            >
              Décider
            </UButton>
            <UButton
              v-if="peutAppliquer && peutAvancerEchelon(row!.original)"
              size="xs"
              icon="i-lucide-trending-up"
              :loading="busy"
              @click="appliquer(row!.original)"
            >
              Appliquer l'avancement
            </UButton>
          </div>
        </template>
      </BaseTable>
    </div>

    <UModal v-model:open="open" title="Décision de la commission">
      <template #body>
        <div class="space-y-4">
          <p v-if="courante" class="text-sm text-muted">{{ agentNom(courante.agent) }}</p>
          <UFormField label="Décision" name="decision" required>
            <USelect v-model="decision" :items="decisionOptions" value-key="value" class="w-full" />
          </UFormField>
          <UFormField
            v-if="decision === 'favorable'"
            label="Échelons accordés"
            name="nombre_echelons"
            help="1 ou 2 — il n'y a pas de changement de classe ici (art. 73–75)."
          >
            <UInputNumber v-model="echelons" :min="1" :max="2" class="w-full" />
          </UFormField>
          <UFormField label="Note retenue (art. 70)" name="note_avancement" help="Peut différer de la note du notateur.">
            <UInputNumber v-model="noteAvancement" :min="0" :max="20" :step="0.25" class="w-full" />
          </UFormField>
          <UFormField label="Commentaire" name="commentaire">
            <UTextarea v-model="commentaire" :rows="3" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
            <UButton :loading="busy" @click="enregistrerDecision">Enregistrer</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
