<script setup lang="ts">
import type { Evaluation } from "~/schemas/evaluation";
import type { ActionEvaluation } from "~/utils/evaluationActions";

/**
 * Actions ouvertes au connecté sur une fiche d'évaluation. La liste vient de
 * `actionsEvaluation()` (étape serveur × identité de l'acteur) : ce composant ne
 * décide de rien, il rend les boutons et porte les saisies obligatoires (avis
 * du notateur, motif de réclamation, décision RH).
 *
 * Après chaque action, on émet `changed` : la page recharge le `show`, seule
 * route qui renvoie la fiche avec toutes ses relations. L'action « noter » n'a
 * pas de modale : elle est relayée à la page (`noter`), qui ouvre la grille —
 * en place sur la fiche, par navigation depuis une liste.
 */
const props = defineProps<{ evaluation: Evaluation }>();
const emit = defineEmits<{ changed: []; noter: [] }>();

const api = useEvaluationsApi();
const reclamationsApi = useReclamationsApi();
const acteur = useActeurEvaluation();
const toast = useToast();
const handleError = useApiError();

const actions = computed(() => actionsEvaluation(props.evaluation, acteur.value));
const busy = ref(false);

// — Saisies des modales ————————————————————————————————————————
const avisOpen = ref(false);
const avis = ref("");
const reclamationOpen = ref(false);
const motif = ref("");
const decisionOpen = ref(false);
const decisionConforme = ref(true);
const commentaireRh = ref("");
const reclamationRhOpen = ref(false);
const reclamationAcceptee = ref(true);
const commentaireReclamation = ref("");

function lancer(action: ActionEvaluation) {
  switch (action.key) {
    case "noter":
      return emit("noter");
    case "avis_et_signer":
      avis.value = props.evaluation.avis_superieur ?? "";
      avisOpen.value = true;
      return;
    case "reclamer":
      motif.value = "";
      reclamationOpen.value = true;
      return;
    case "valider_rh":
    case "rejeter_rh":
      decisionConforme.value = action.key === "valider_rh";
      commentaireRh.value = "";
      decisionOpen.value = true;
      return;
    case "traiter_reclamation":
      reclamationAcceptee.value = true;
      commentaireReclamation.value = "";
      reclamationRhOpen.value = true;
      return;
    case "signer_evalue":
      return executer(
        () => api.signerEvalue(props.evaluation.id),
        "Fiche signée. Vous pouvez la transmettre à la RH ou la contester.",
      );
    case "envoyer_rh":
      return executer(() => api.envoyerRh(props.evaluation.id), "Fiche transmise à la RH.");
    case "annuler":
      if (!confirm("Annuler cette fiche d'évaluation ? L'opération est définitive.")) return;
      return executer(() => api.annuler(props.evaluation.id), "Fiche annulée.");
  }
}

/** Exécute une action et prévient la page ; les 422 métier passent par le toast. */
async function executer(fn: () => Promise<unknown>, message: string) {
  busy.value = true;
  try {
    await fn();
    toast.add({ title: message, color: "success" });
    avisOpen.value = false;
    reclamationOpen.value = false;
    decisionOpen.value = false;
    reclamationRhOpen.value = false;
    emit("changed");
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

function confirmerAvis() {
  if (avis.value.trim().length < 10) {
    toast.add({ title: "Avis requis (10 caractères min.).", color: "error" });
    return;
  }
  executer(
    () => api.avisEtSigner(props.evaluation.id, { avis_superieur: avis.value.trim() }),
    "Avis enregistré et fiche signée.",
  );
}

function confirmerReclamation() {
  if (motif.value.trim().length < 10) {
    toast.add({ title: "Motif requis (10 caractères min.).", color: "error" });
    return;
  }
  executer(
    () => api.reclamer(props.evaluation.id, { motif: motif.value.trim() }),
    "Réclamation enregistrée. La RH va l'examiner.",
  );
}

function confirmerDecision() {
  executer(
    () =>
      api.validerRh(props.evaluation.id, {
        conforme: decisionConforme.value,
        commentaire: commentaireRh.value.trim() || null,
      }),
    decisionConforme.value ? "Fiche finalisée et inscrite au tableau." : "Fiche rejetée vers le notateur.",
  );
}

function confirmerTraitementReclamation() {
  const id = props.evaluation.reclamation?.id;
  if (!id) {
    toast.add({ title: "Réclamation introuvable sur cette fiche.", color: "error" });
    return;
  }
  executer(
    () =>
      reclamationsApi.traiter(id, {
        acceptee: reclamationAcceptee.value,
        commentaire: commentaireReclamation.value.trim() || null,
      }),
    reclamationAcceptee.value ? "Réclamation acceptée : fiche renvoyée au notateur." : "Réclamation rejetée : note maintenue.",
  );
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
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

    <!-- Avis du notateur (obligatoire avant signature — CCN art. 63) -->
    <UModal v-model:open="avisOpen" title="Avis du notateur et signature">
      <template #body>
        <div class="space-y-4">
          <p class="text-sm text-muted">
            La signature vaut clôture de la notation : la grille ne sera plus modifiable.
          </p>
          <UFormField label="Avis motivé" name="avis_superieur" required>
            <UTextarea v-model="avis" :rows="5" placeholder="Appréciation générale (10 caractères min.)" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="avisOpen = false">Annuler</UButton>
            <UButton :loading="busy" @click="confirmerAvis">Signer</UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Réclamation de l'agent (CCN art. 65) -->
    <UModal v-model:open="reclamationOpen" title="Contester ma note">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Motif de la réclamation" name="motif" required>
            <UTextarea v-model="motif" :rows="5" placeholder="Expliquez ce que vous contestez (10 caractères min.)" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="reclamationOpen = false">Annuler</UButton>
            <UButton color="warning" :loading="busy" @click="confirmerReclamation">Envoyer la réclamation</UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Décision RH -->
    <UModal v-model:open="decisionOpen" :title="decisionConforme ? 'Valider la fiche' : 'Rejeter la fiche'">
      <template #body>
        <div class="space-y-4">
          <p class="text-sm text-muted">
            {{
              decisionConforme
                ? "La fiche sera finalisée et inscrite au tableau d'avancement."
                : "La fiche repart au notateur pour correction."
            }}
          </p>
          <UFormField label="Commentaire" name="commentaire">
            <UTextarea v-model="commentaireRh" :rows="4" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="decisionOpen = false">Annuler</UButton>
            <UButton :color="decisionConforme ? 'success' : 'error'" :loading="busy" @click="confirmerDecision">
              {{ decisionConforme ? "Valider" : "Rejeter" }}
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Traitement RH de la réclamation -->
    <UModal v-model:open="reclamationRhOpen" title="Traiter la réclamation">
      <template #body>
        <div class="space-y-4">
          <p v-if="evaluation.reclamation" class="rounded-lg bg-elevated p-3 text-sm text-default">
            « {{ evaluation.reclamation.motif }} »
          </p>
          <UFormField label="Décision" name="acceptee">
            <USelect
              v-model="reclamationAcceptee"
              :items="[
                { label: 'Accepter — renvoi au notateur', value: true },
                { label: 'Rejeter — note maintenue', value: false },
              ]"
              value-key="value"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Commentaire" name="commentaire">
            <UTextarea v-model="commentaireReclamation" :rows="4" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="reclamationRhOpen = false">Annuler</UButton>
            <UButton :loading="busy" @click="confirmerTraitementReclamation">Enregistrer la décision</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
