<script setup lang="ts">
import {
  agentNom,
  ETAPE_EVALUATION_LABEL,
  STATUT_RECLAMATION_COLOR,
  STATUT_RECLAMATION_LABEL,
  type EtapeEvaluation,
  type StatutReclamation,
} from "~/constants/evaluations";

/**
 * Fiche d'évaluation : notation critère par critère (N+1), contexte, avis et
 * signatures, réclamation de l'agent (art. 65), chaîne d'avis hiérarchiques
 * (art. 64), besoins de formation et décision RH.
 *
 * Toutes les actions passent par `EvaluationsActionsFiche`, qui ne propose que
 * ce que l'étape serveur **et** l'identité du connecté autorisent.
 *
 * ## Mise à jour de l'écran
 *
 * La notation enchaîne 24 critères : elle ne doit jamais vider la page. Deux
 * régimes, décrits dans `useEvaluation` :
 * - la grille renvoie la fiche recalculée → `appliquer`, sans appel réseau ;
 * - les autres actions (modales, avis, réclamation) touchent des relations que
 *   leur réponse ne porte pas → `rafraichirEnFond`, qui refetch le `show` en
 *   laissant l'écran en place.
 */
const route = useRoute();
const id = computed(() => Number(route.params.id));

const api = useEvaluationsApi();
const acteur = useActeurEvaluation();
const toast = useToast();
const handleError = useApiError();

const { evaluation, chargementInitial, rafraichissement, error, rafraichirEnFond, appliquer } =
  useEvaluation(id);

const notateur = computed(() => !!evaluation.value && estNotateur(evaluation.value, acteur.value));
const grilleEditable = computed(
  () => !!evaluation.value && notateur.value && acteur.value.peutValider && grilleOuverte(evaluation.value),
);
const pdfDispo = computed(() => !!evaluation.value && peutTelechargerFiche(evaluation.value, acteur.value));

// Réattribution du notateur (note FE §7b) : RH, session ouverte, fiche vivante.
const reattributionOpen = ref(false);
const peutReattribuer = computed(
  () => !!evaluation.value && peutReattribuerSuperieur(evaluation.value, acteur.value),
);

// Inscription au tableau d'avancement (D5) : RH, sur une fiche finalisée.
const actionsTab = computed(() =>
  evaluation.value ? actionsTableau(evaluation.value, acteur.value) : [],
);

// Ancre de la grille : l'action « Évaluer » y amène au lieu d'ouvrir une modale.
const grilleRef = useTemplateRef<HTMLElement>("grille");
function versLaGrille() {
  grilleRef.value?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const busy = ref(false);

async function basculerTableau(inscrire: boolean) {
  busy.value = true;
  try {
    if (inscrire) await api.inscrireTableau(id.value);
    else await api.retirerTableau(id.value);
    toast.add({ title: inscrire ? "Fiche inscrite au tableau" : "Fiche retirée du tableau", color: "success" });
    await rafraichirEnFond();
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

async function telechargerPdf() {
  busy.value = true;
  try {
    downloadBlob(await api.fichePdf(id.value), `fiche-evaluation-${id.value}.pdf`);
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

// — Contexte de la fiche (saisi par le notateur) ————————————————
const contexteOpen = ref(false);
const contexte = reactive<{ jours_absence_non_justifiee?: number; sanctions?: string }>({});

function ouvrirContexte() {
  contexte.jours_absence_non_justifiee = evaluation.value?.jours_absence_non_justifiee ?? 0;
  contexte.sanctions = evaluation.value?.sanctions ?? "";
  contexteOpen.value = true;
}

async function enregistrerContexte() {
  busy.value = true;
  try {
    await api.updateContexte(id.value, {
      jours_absence_non_justifiee: contexte.jours_absence_non_justifiee ?? 0,
      sanctions: contexte.sanctions?.trim() || null,
    });
    toast.add({ title: "Contexte enregistré", color: "success" });
    contexteOpen.value = false;
    await rafraichirEnFond();
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <BasePanel title="Fiche d'évaluation" subtitle="Notation, avis et signatures">
    <template #actions>
      <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" @click="$router.back()">Retour</UButton>
    </template>

    <BaseDataState
      :pending="chargementInitial"
      :error="error"
      :empty="!chargementInitial && !evaluation"
      empty-label="Fiche introuvable"
    >
      <div v-if="evaluation" class="space-y-6">
        <!-- En-tête -->
        <div class="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-default bg-default p-5">
          <div class="min-w-0">
            <p class="text-lg font-semibold text-highlighted">{{ agentNom(evaluation.agent) }}</p>
            <p class="flex flex-wrap items-center gap-1.5 text-sm text-muted">
              <span v-if="evaluation.superieur">Notateur : {{ agentNom(evaluation.superieur) }}</span>
              <!--
                Un agent sans notateur ne peut être ni noté ni validé : on le
                signale au lieu d'afficher un tiret, et on ouvre l'action qui
                le corrige — c'est l'alerte « sans N+1 » du tableau de bord.
              -->
              <UBadge v-else color="warning" variant="subtle" size="sm" icon="i-lucide-user-x">
                Aucun notateur désigné
              </UBadge>
              <UButton
                v-if="peutReattribuer"
                size="xs"
                color="neutral"
                variant="ghost"
                icon="i-lucide-user-round-cog"
                :title="evaluation.superieur ? 'Changer le notateur' : 'Désigner un notateur'"
                @click="reattributionOpen = true"
              >
                {{ evaluation.superieur ? "Changer" : "Désigner" }}
              </UButton>
              <span v-if="evaluation.session">
                · Session {{ evaluation.session.description ?? formatDate(evaluation.session.debut_session) }}
              </span>
            </p>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <EvaluationsStatutBadge :statut="evaluation.statut" :label="evaluation.statut_label" />
              <UBadge v-if="evaluation.prochaine_etape" color="neutral" variant="outline" size="sm">
                {{ ETAPE_EVALUATION_LABEL[evaluation.prochaine_etape as EtapeEvaluation] }}
              </UBadge>
              <UBadge v-if="evaluation.inscrit_tableau" color="success" variant="outline" size="sm">
                Inscrite au tableau d'avancement
              </UBadge>
              <EvaluationsMentionBadge :note="evaluation.note_globale" :mention="evaluation.mention" />
              <!-- Témoin de mise à jour : l'écran reste lisible pendant le refetch,
                   mais on ne laisse pas croire que la fiche est figée. -->
              <span v-if="rafraichissement" class="flex items-center gap-1.5 text-xs text-muted">
                <UIcon name="i-lucide-loader-circle" class="size-3.5 animate-spin" />
                Mise à jour…
              </span>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-end gap-2">
            <UButton
              v-if="pdfDispo"
              icon="i-lucide-file-down"
              color="neutral"
              variant="soft"
              :loading="busy"
              @click="telechargerPdf"
            >
              Fiche PDF
            </UButton>
            <UButton
              v-for="action in actionsTab"
              :key="action.key"
              :icon="action.icon"
              :color="action.color"
              variant="soft"
              :loading="busy"
              @click="basculerTableau(action.key === 'inscrire_tableau')"
            >
              {{ action.label }}
            </UButton>
            <EvaluationsActionsFiche
              :evaluation="evaluation"
              @changed="rafraichirEnFond"
              @noter="versLaGrille"
            />
          </div>
        </div>

        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <!-- Grille de notation -->
          <div ref="grille" class="rounded-xl border border-default bg-default p-5">
            <div class="flex items-center justify-between gap-3">
              <BaseCardTitle icon="i-lucide-list-checks" title="Grille de notation" />
              <UButton
                v-if="grilleEditable"
                size="xs"
                color="neutral"
                variant="soft"
                icon="i-lucide-clipboard-list"
                @click="ouvrirContexte"
              >
                Contexte
              </UButton>
            </div>
            <div class="mt-4">
              <EvaluationsGrilleNotation
                :evaluation="evaluation"
                :editable="grilleEditable"
                @saved="appliquer"
              />
            </div>
          </div>

          <!-- Suivi -->
          <div class="space-y-6">
            <div class="rounded-xl border border-default bg-default p-5">
              <BaseCardTitle icon="i-lucide-info" title="Contexte de la notation" />
              <dl class="mt-4 space-y-4">
                <BaseDefItem
                  label="Poste retenu (art. 62)"
                  :value="evaluation.affectation_notation?.structure?.nom"
                />
                <BaseDefItem
                  label="Absences non justifiées"
                  :value="evaluation.jours_absence_non_justifiee != null ? `${evaluation.jours_absence_non_justifiee} jour(s)` : null"
                />
                <BaseDefItem label="Sanctions" :value="evaluation.sanctions" />
                <BaseDefItem label="Avis du notateur" :value="evaluation.avis_superieur" />
              </dl>
            </div>

            <div class="rounded-xl border border-default bg-default p-5">
              <BaseCardTitle icon="i-lucide-pen-tool" title="Signatures et décision" />
              <dl class="mt-4 space-y-4">
                <BaseDefItem label="Signée par le notateur" :value="formatDateTime(evaluation.signe_par_evaluateur_at)" />
                <BaseDefItem label="Signée par l'agent" :value="formatDateTime(evaluation.signe_par_evalue_at)" />
                <BaseDefItem label="Validation RH" :value="formatDateTime(evaluation.date_validation_rh)" />
                <BaseDefItem label="Commentaire RH" :value="evaluation.commentaire_rh" />
              </dl>
            </div>

            <!-- Réclamation (art. 65) -->
            <div v-if="evaluation.reclamation" class="rounded-xl border border-default bg-default p-5">
              <BaseCardTitle icon="i-lucide-message-square-warning" title="Réclamation" />
              <div class="mt-4 space-y-3">
                <UBadge
                  :color="STATUT_RECLAMATION_COLOR[evaluation.reclamation.statut as StatutReclamation] ?? 'neutral'"
                  variant="subtle"
                >
                  {{ evaluation.reclamation.statut_label ?? STATUT_RECLAMATION_LABEL[evaluation.reclamation.statut as StatutReclamation] }}
                </UBadge>
                <p class="text-sm text-default">« {{ evaluation.reclamation.motif }} »</p>
                <p v-if="evaluation.reclamation.commentaire_rh" class="text-sm text-muted">
                  Réponse RH : {{ evaluation.reclamation.commentaire_rh }}
                </p>
              </div>
            </div>

            <!-- Chaîne d'avis hiérarchiques (art. 64) -->
            <div class="rounded-xl border border-default bg-default p-5">
              <EvaluationsAvisHierarchiques :evaluation="evaluation" @changed="rafraichirEnFond" />
            </div>

            <!-- Besoins de formation relevés pendant l'évaluation -->
            <div class="rounded-xl border border-default bg-default p-5">
              <EvaluationsConnaissances :evaluation="evaluation" />
            </div>
          </div>
        </div>
      </div>
      <EvaluationsReattributionModal
        v-if="evaluation && peutReattribuer"
        v-model:open="reattributionOpen"
        :evaluation="evaluation"
        @done="rafraichirEnFond"
      />
    </BaseDataState>

    <!-- Contexte de la fiche (notateur) -->
    <UModal v-model:open="contexteOpen" title="Contexte de la notation">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Jours d'absence non justifiée" name="jours_absence_non_justifiee">
            <UInputNumber v-model="contexte.jours_absence_non_justifiee" :min="0" :max="365" class="w-full" />
          </UFormField>
          <UFormField label="Sanctions de la période" name="sanctions">
            <UTextarea v-model="contexte.sanctions" :rows="4" placeholder="Aucune, ou détail des sanctions" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="contexteOpen = false">Annuler</UButton>
            <UButton :loading="busy" @click="enregistrerContexte">Enregistrer</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </BasePanel>
</template>
