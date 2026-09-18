<script setup lang="ts">
import type { Evaluation } from "~/schemas/evaluation";
import { agentNom } from "~/constants/evaluations";

/**
 * Réattribution du notateur d'une fiche (`PUT …/superieur`, note FE §7b).
 *
 * Sert deux situations réelles :
 * - l'agent n'a **pas de supérieur** identifié — c'est l'alerte de conformité
 *   « sans N+1 » du tableau de bord, qui n'avait jusqu'ici aucune action pour
 *   se résoudre côté évaluation ;
 * - le notateur désigné a changé de poste en cours de campagne.
 *
 * Réservé à la RH (`creer-evaluations`), et seulement tant que la session est
 * ouverte et la fiche non terminée : au-delà, changer le notateur réécrirait
 * qui a signé.
 */
const props = defineProps<{ evaluation: Evaluation }>();
const emit = defineEmits<{ done: [] }>();

const open = defineModel<boolean>("open", { default: false });

const api = useEvaluationsApi();
const toast = useToast();
const handleError = useApiError();

const busy = ref(false);
const superieurId = ref<number | undefined>(undefined);

const { options: agentOptions } = useResourceOptions(
  "reattribution-agents",
  () => useAgentsApi().list(),
  (a) => agentNom(a),
);

/** L'agent noté ne peut pas être son propre notateur. */
const choix = computed(() =>
  agentOptions.value.filter((o) => o.value !== props.evaluation.agent_id),
);

watch(open, (ouvert) => {
  if (ouvert) superieurId.value = props.evaluation.superieur_id ?? undefined;
});

async function enregistrer() {
  if (!superieurId.value) {
    toast.add({ title: "Sélectionnez un notateur.", color: "error" });
    return;
  }
  busy.value = true;
  try {
    await api.reattribuerSuperieur(props.evaluation.id, { superieur_id: superieurId.value });
    toast.add({ title: "Notateur réattribué", color: "success" });
    open.value = false;
    emit("done");
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Changer le notateur">
    <template #body>
      <div class="space-y-4">
        <p class="text-sm text-muted">
          Fiche de <strong class="font-medium text-highlighted">{{ agentNom(evaluation.agent) }}</strong>.
          <template v-if="evaluation.superieur">
            Notée aujourd'hui par {{ agentNom(evaluation.superieur) }}.
          </template>
          <template v-else>
            <span class="text-warning">Aucun notateur n'est actuellement désigné.</span>
          </template>
        </p>

        <UFormField
          label="Nouveau notateur"
          name="superieur_id"
          required
          help="C'est lui qui notera la fiche et donnera son avis (art. 64)."
        >
          <USelectMenu
            v-model="superieurId"
            :items="choix"
            value-key="value"
            placeholder="Sélectionner un agent"
            class="w-full"
          />
        </UFormField>

        <UAlert
          v-if="evaluation.statut !== 'en_attente'"
          color="warning"
          variant="subtle"
          icon="i-lucide-triangle-alert"
          title="La notation a déjà commencé"
          description="Les notes déjà saisies restent en place ; c'est le nouveau notateur qui les reprendra et signera."
        />

        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
          <UButton :loading="busy" @click="enregistrer">Réattribuer</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
