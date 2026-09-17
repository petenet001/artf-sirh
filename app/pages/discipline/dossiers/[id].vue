<script setup lang="ts">
import type { ActionSanction } from "~/constants/discipline";
import { actionsSanction, agentNom, exigeIndemnite, exigeNbJours } from "~/constants/discipline";

/**
 * Dossier disciplinaire : exposé des faits, pièces (art. 91), instruction RH,
 * prononcé ou classement par le DG, et les deux PDF (rapport, décision).
 *
 * La séparation des rôles est stricte depuis la mise en conformité CCN : la RH
 * instruit sans prononcer, le DG prononce sans instruire. `actionsSanction`
 * croise l'étape serveur et la permission pour ne proposer que le légitime.
 */
const route = useRoute();
const id = computed(() => Number(route.params.id));

const api = useSanctionsApi();
const acteur = useActeurDiscipline();
const toast = useToast();
const handleError = useApiError();

const { data, pending, error, refresh } = useAsyncData(
  () => `sanction-${id.value}`,
  () => (id.value > 0 ? api.getById(id.value) : Promise.resolve(null)),
  { watch: [id] },
);
const dossier = computed(() => data.value?.data ?? null);

const actions = computed(() => (dossier.value ? actionsSanction(dossier.value, acteur.value) : []));
const decisionDispo = computed(() => dossier.value?.statut === "validee");
const dureeRequise = computed(() => exigeNbJours(dossier.value?.type_sanction));
const indemniteAttendue = computed(() => exigeIndemnite(dossier.value?.type_sanction));

const busy = ref(false);

// — Instruction (RH) ————————————————————————————————————————————
const instructionOpen = ref(false);
const notes = ref("");
const decisionProposee = ref("");

// — Prononcé (DG) ——————————————————————————————————————————————
const prononceOpen = ref(false);
const decision = ref("");
const dateDecision = ref<string | undefined>(undefined);
const commentaire = ref("");
const nbJours = ref<number | undefined>(undefined);
const dateDebutEffet = ref<string | undefined>(undefined);
const avecIndemnite = ref(true);

// — Classement sans suite (DG) ————————————————————————————————
const classementOpen = ref(false);
const motifClassement = ref("");

function lancer(action: ActionSanction) {
  switch (action.key) {
    case "instruire":
      notes.value = dossier.value?.notes_instruction ?? "";
      decisionProposee.value = dossier.value?.decision ?? "";
      instructionOpen.value = true;
      return;
    case "prononcer":
      decision.value = dossier.value?.decision ?? "";
      dateDecision.value = undefined;
      commentaire.value = "";
      nbJours.value = dossier.value?.nb_jours ?? undefined;
      dateDebutEffet.value = undefined;
      avecIndemnite.value = dossier.value?.avec_indemnite ?? true;
      prononceOpen.value = true;
      return;
    case "classer":
      motifClassement.value = "";
      classementOpen.value = true;
      return;
    case "supprimer":
      if (!confirm("Supprimer ce rapport ? L'opération est définitive.")) return;
      executer(() => api.remove(id.value), "Rapport supprimé", "/discipline/dossiers");
  }
}

async function executer(fn: () => Promise<unknown>, message: string, redirection?: string) {
  busy.value = true;
  try {
    await fn();
    toast.add({ title: message, color: "success" });
    instructionOpen.value = false;
    prononceOpen.value = false;
    classementOpen.value = false;
    if (redirection) await navigateTo(redirection);
    else await refresh();
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

function instruire() {
  if (notes.value.trim().length < 3) {
    toast.add({ title: "Notes d'instruction requises (3 caractères min.).", color: "error" });
    return;
  }
  executer(
    () =>
      api.instruire(id.value, {
        notes_instruction: notes.value.trim(),
        decision: decisionProposee.value.trim() || null,
      }),
    "Dossier instruit — transmis au Directeur Général",
  );
}

function prononcer() {
  if (decision.value.trim().length < 3) {
    toast.add({ title: "Décision requise (3 caractères min.).", color: "error" });
    return;
  }
  executer(
    () =>
      api.prononcer(id.value, {
        decision: decision.value.trim(),
        date_decision: dateDecision.value || null,
        commentaire: commentaire.value.trim() || null,
        nb_jours: dureeRequise.value ? nbJours.value ?? null : null,
        date_debut_effet: dureeRequise.value ? dateDebutEffet.value || null : null,
        avec_indemnite: indemniteAttendue.value ? avecIndemnite.value : null,
      }),
    "Sanction prononcée",
  );
}

function classer() {
  if (motifClassement.value.trim().length < 3) {
    toast.add({ title: "Motif requis (3 caractères min.).", color: "error" });
    return;
  }
  executer(
    () => api.classer(id.value, { commentaire: motifClassement.value.trim() }),
    "Dossier classé sans suite",
  );
}

async function telecharger(kind: "rapport" | "decision") {
  busy.value = true;
  try {
    const blob = kind === "rapport" ? await api.rapportPdf(id.value) : await api.decisionPdf(id.value);
    downloadBlob(blob, `${kind}-disciplinaire-${id.value}.pdf`);
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <BasePanel title="Dossier disciplinaire" subtitle="Instruction et décision (CCN art. 90–91)">
    <template #actions>
      <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" to="/discipline/dossiers">Retour</UButton>
    </template>

    <BaseDataState :pending="pending" :error="error" :empty="!dossier" empty-label="Dossier introuvable">
      <div v-if="dossier" class="space-y-6">
        <!-- En-tête -->
        <div class="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-default bg-default p-5">
          <div class="min-w-0">
            <p class="text-lg font-semibold text-highlighted">{{ agentNom(dossier.agent) }}</p>
            <p class="text-sm text-muted">
              {{ dossier.type_sanction?.nom ?? "Sanction non précisée" }}
              <span v-if="dossier.date_faits"> · faits du {{ formatDateLong(dossier.date_faits) }}</span>
            </p>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <DisciplineStatutBadge :statut="dossier.statut" :label="dossier.statut_label" />
              <UBadge v-if="dossier.recidive" color="error" variant="outline" size="sm">
                Récidive sur 5 ans
              </UBadge>
              <UBadge v-if="dossier.dans_delai_conservation === false" color="neutral" variant="outline" size="sm">
                Hors délai de conservation
              </UBadge>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-end gap-2">
            <UButton icon="i-lucide-file-down" color="neutral" variant="soft" :loading="busy" @click="telecharger('rapport')">
              Rapport PDF
            </UButton>
            <UButton v-if="decisionDispo" icon="i-lucide-file-check" color="neutral" variant="soft" :loading="busy" @click="telecharger('decision')">
              Décision PDF
            </UButton>
            <UButton
              v-for="action in actions"
              :key="action.key"
              :icon="action.icon"
              :color="action.color"
              :variant="action.principale ? 'solid' : 'soft'"
              :loading="busy"
              @click="lancer(action)"
            >
              {{ action.label }}
            </UButton>
          </div>
        </div>

        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div class="space-y-6">
            <!-- Faits et décision -->
            <div class="rounded-xl border border-default bg-default p-5">
              <BaseCardTitle icon="i-lucide-file-warning" title="Faits reprochés" />
              <dl class="mt-4 grid gap-x-10 gap-y-4 sm:grid-cols-2">
                <BaseDefItem label="Date des faits" :value="formatDateLong(dossier.date_faits)" />
                <BaseDefItem label="Rapport déposé par" :value="dossier.createur?.name" />
                <BaseDefItem
                  v-if="dossier.nb_jours != null"
                  label="Durée de mise à pied"
                  :value="`${dossier.nb_jours} jour(s)`"
                />
                <BaseDefItem
                  v-if="dossier.avec_indemnite != null"
                  label="Indemnité de licenciement"
                  :value="dossier.avec_indemnite ? 'Oui' : 'Non'"
                />
                <BaseDefItem label="Motif" :value="dossier.motif" class="sm:col-span-2" />
              </dl>
            </div>

            <!-- Instruction : réservée aux détenteurs de consulter/gerer-discipline -->
            <div v-if="dossier.notes_instruction" class="rounded-xl border border-default bg-default p-5">
              <BaseCardTitle icon="i-lucide-file-search" title="Instruction" />
              <p class="mt-4 whitespace-pre-line text-sm text-default">{{ dossier.notes_instruction }}</p>
            </div>

            <!-- Décision -->
            <div v-if="dossier.decision || dossier.commentaire_validation" class="rounded-xl border border-default bg-default p-5">
              <BaseCardTitle icon="i-lucide-gavel" title="Décision" />
              <dl class="mt-4 grid gap-x-10 gap-y-4 sm:grid-cols-2">
                <BaseDefItem label="Prononcée le" :value="formatDateLong(dossier.date_decision)" />
                <BaseDefItem label="Par" :value="dossier.validateur?.name" />
                <BaseDefItem label="Prise d'effet" :value="formatDateLong(dossier.date_debut_effet)" />
                <BaseDefItem label="Fin d'effet" :value="formatDateLong(dossier.date_fin_effet)" />
                <BaseDefItem label="Décision" :value="dossier.decision" class="sm:col-span-2" />
                <BaseDefItem label="Commentaire" :value="dossier.commentaire_validation" class="sm:col-span-2" />
              </dl>
            </div>
          </div>

          <div class="space-y-6">
            <!-- Pièces -->
            <div class="rounded-xl border border-default bg-default p-5">
              <DisciplinePieces :dossier="dossier" @changed="refresh" />
            </div>

            <!-- Antécédents (récidive art. 90) -->
            <div v-if="dossier.antecedents_5_ans?.length" class="rounded-xl border border-default bg-default p-5">
              <BaseCardTitle icon="i-lucide-history" title="Antécédents (5 ans)" />
              <ul class="mt-4 space-y-3">
                <li v-for="a in dossier.antecedents_5_ans" :key="a.id" class="border-b border-default pb-3 last:border-0 last:pb-0">
                  <p class="text-sm font-medium text-highlighted">{{ a.type ?? "Sanction" }}</p>
                  <p class="text-xs text-muted">{{ formatDate(a.date_decision) }}</p>
                  <p v-if="a.motif" class="mt-1 text-sm text-default">{{ a.motif }}</p>
                </li>
              </ul>
            </div>

            <!-- Conservation (art. 91) -->
            <div class="rounded-xl border border-default bg-default p-5">
              <BaseCardTitle icon="i-lucide-calendar-clock" title="Conservation" />
              <dl class="mt-4 space-y-4">
                <BaseDefItem label="Conservée jusqu'au" :value="formatDateLong(dossier.conservee_jusqu_au)" />
                <BaseDefItem label="Déposé le" :value="formatDateTime(dossier.created_at)" />
              </dl>
            </div>
          </div>
        </div>
      </div>
    </BaseDataState>

    <!-- Instruction (RH) -->
    <UModal v-model:open="instructionOpen" title="Instruire le dossier">
      <template #body>
        <div class="space-y-4">
          <p class="text-sm text-muted">
            Le dossier partira au Directeur Général, seul habilité à prononcer la sanction.
          </p>
          <UFormField label="Notes d'instruction" name="notes_instruction" required>
            <UTextarea v-model="notes" :rows="5" placeholder="Constats, auditions, éléments retenus" class="w-full" />
          </UFormField>
          <UFormField label="Sanction proposée" name="decision" help="Facultative — le DG reste libre de sa décision.">
            <UTextarea v-model="decisionProposee" :rows="3" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="instructionOpen = false">Annuler</UButton>
            <UButton :loading="busy" @click="instruire">Transmettre au DG</UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Prononcé (DG) -->
    <UModal v-model:open="prononceOpen" title="Prononcer la sanction">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Décision" name="decision" required>
            <UTextarea v-model="decision" :rows="4" placeholder="Sanction prononcée et sa motivation" class="w-full" />
          </UFormField>
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Date de la décision" name="date_decision">
              <UInput v-model="dateDecision" type="date" class="w-full" />
            </UFormField>
            <UFormField v-if="dureeRequise" label="Prise d'effet" name="date_debut_effet">
              <UInput v-model="dateDebutEffet" type="date" class="w-full" />
            </UFormField>
          </div>
          <UFormField
            v-if="dureeRequise"
            label="Durée (jours)"
            name="nb_jours"
            help="1 à 8 jours ; la fin d'effet est calculée par l'API."
          >
            <UInputNumber v-model="nbJours" :min="1" :max="8" class="w-full" />
          </UFormField>
          <UFormField v-if="indemniteAttendue" name="avec_indemnite">
            <USwitch v-model="avecIndemnite" label="Licenciement avec indemnité" />
          </UFormField>
          <UFormField label="Commentaire" name="commentaire">
            <UTextarea v-model="commentaire" :rows="3" class="w-full" />
          </UFormField>
          <p class="text-xs text-muted">
            Une mise à pied suspend l'agent à la prise d'effet ; un licenciement archive son dossier
            et désactive son compte.
          </p>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="prononceOpen = false">Annuler</UButton>
            <UButton color="error" :loading="busy" @click="prononcer">Prononcer</UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Classement sans suite (DG) -->
    <UModal v-model:open="classementOpen" title="Classer sans suite">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Motif du classement" name="commentaire" required>
            <UTextarea v-model="motifClassement" :rows="4" placeholder="Motif (3 caractères min.)" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="classementOpen = false">Annuler</UButton>
            <UButton :loading="busy" @click="classer">Classer</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </BasePanel>
</template>
