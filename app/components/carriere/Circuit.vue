<script setup lang="ts">
import type { ValidationWorkflow } from "~/schemas/validation-workflow";

/**
 * Circuit de validation d'un acte de carrière (affectation / nomination).
 * Contrairement au circuit dossier (endpoint dédié), les validations sont
 * portées par l'entité elle-même (`entity.validations`) : on les reçoit en prop
 * et on remonte `changed` après chaque décision pour que le parent recharge.
 * Le moteur de décision est partagé (`POST /integration/validations/{id}/…`).
 */
const props = defineProps<{ validations: ValidationWorkflow[] }>();
const emit = defineEmits<{ changed: [] }>();

const validationsApi = useValidationsApi();
const toast = useToast();
const handleError = useApiError();

const niveaux = computed(() => [...props.validations].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0)));

const isApproved = (v: ValidationWorkflow) =>
  ["approuve", "approuvé", "valide", "validé"].includes((v.statut ?? "").toLowerCase());
const isRejected = (v: ValidationWorkflow) =>
  ["rejete", "rejeté", "renvoye", "renvoyé"].includes((v.statut ?? "").toLowerCase());

// Niveau actionnable = premier « en attente ».
const actionableId = computed(
  () => niveaux.value.find((v) => !isApproved(v) && !isRejected(v))?.id ?? null,
);
const badgeColor = (v: ValidationWorkflow) =>
  isApproved(v) ? "success" : isRejected(v) ? "error" : "neutral";

const open = ref(false);
const submitting = ref(false);
const current = ref<{ id: number; kind: "approuver" | "renvoyer" | "rejeter" } | null>(null);
const commentaire = ref("");

const kindLabel: Record<"approuver" | "renvoyer" | "rejeter", string> = {
  approuver: "Approuver",
  renvoyer: "Renvoyer pour correction",
  rejeter: "Rejeter",
};

function openDecision(id: number, kind: "approuver" | "renvoyer" | "rejeter") {
  current.value = { id, kind };
  commentaire.value = "";
  open.value = true;
}

async function confirm() {
  if (!current.value) return;
  const { id, kind } = current.value;
  if (kind === "rejeter" && !commentaire.value.trim()) {
    toast.add({ title: "Un commentaire est requis pour rejeter", color: "warning" });
    return;
  }
  submitting.value = true;
  try {
    if (kind === "approuver") await validationsApi.approuver(id, { commentaire: commentaire.value || undefined });
    else if (kind === "renvoyer") await validationsApi.renvoyer(id, { commentaire: commentaire.value || undefined });
    else await validationsApi.rejeter(id, { commentaire: commentaire.value });
    toast.add({ title: `${kindLabel[kind]} — décision enregistrée`, color: "success" });
    open.value = false;
    emit("changed");
  } catch (err) {
    handleError(err);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div>
    <p v-if="!niveaux.length" class="text-sm text-muted">Aucun circuit de validation.</p>

    <ol v-else class="space-y-1">
      <li v-for="(niveau, i) in niveaux" :key="niveau.id" class="flex gap-3">
        <div class="flex flex-col items-center">
          <span
            class="flex size-8 shrink-0 items-center justify-center rounded-full border"
            :class="{
              'border-success bg-success text-inverted': isApproved(niveau),
              'border-error bg-error text-inverted': isRejected(niveau),
              'border-primary text-primary': niveau.id === actionableId,
              'border-default text-dimmed':
                niveau.id !== actionableId && !isApproved(niveau) && !isRejected(niveau),
            }"
          >
            <UIcon
              :name="isApproved(niveau) ? 'i-lucide-check' : isRejected(niveau) ? 'i-lucide-x' : 'i-lucide-user'"
              class="size-4"
            />
          </span>
          <span v-if="i < niveaux.length - 1" class="my-1 w-px flex-1 bg-default" />
        </div>
        <div class="flex-1 pb-5">
          <div class="flex items-center gap-2">
            <p class="text-sm font-medium text-highlighted">
              {{ niveau.niveau_label ?? niveau.niveau ?? `Niveau ${niveau.ordre}` }}
            </p>
            <UBadge :color="badgeColor(niveau)" variant="subtle" size="sm" class="capitalize">
              {{ niveau.statut }}
            </UBadge>
          </div>
          <p v-if="niveau.validateur?.name" class="mt-0.5 text-xs text-muted">
            {{ niveau.validateur.name }}<span v-if="niveau.date_decision"> · {{ formatDateTime(niveau.date_decision) }}</span>
          </p>
          <p v-if="niveau.commentaire" class="mt-1 text-xs italic text-toned">« {{ niveau.commentaire }} »</p>

          <div v-if="niveau.id === actionableId" class="mt-2 flex flex-wrap gap-2">
            <UButton icon="i-lucide-check" size="xs" color="success" @click="openDecision(niveau.id, 'approuver')">Approuver</UButton>
            <UButton icon="i-lucide-corner-up-left" size="xs" color="warning" variant="soft" @click="openDecision(niveau.id, 'renvoyer')">Renvoyer</UButton>
            <UButton icon="i-lucide-x" size="xs" color="error" variant="soft" @click="openDecision(niveau.id, 'rejeter')">Rejeter</UButton>
          </div>
        </div>
      </li>
    </ol>

    <UModal v-model:open="open" :title="current ? kindLabel[current.kind] : ''">
      <template #title>
        <BaseCardTitle
          :icon="current?.kind === 'rejeter' ? 'i-lucide-x' : 'i-lucide-check'"
          :title="current ? kindLabel[current.kind] : ''"
        />
      </template>
      <template #body>
        <div class="space-y-4">
          <UFormField label="Commentaire" :required="current?.kind === 'rejeter'">
            <UTextarea v-model="commentaire" :rows="3" class="w-full" placeholder="Motif / observation…" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
            <UButton :loading="submitting" @click="confirm">Confirmer</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
