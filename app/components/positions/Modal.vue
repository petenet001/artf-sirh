<script setup lang="ts">
import type { PositionConventionnelleInput } from "~/schemas/position-conventionnelle";
import { TYPES_POSITION } from "~/constants/enums";
import { agentNom, EFFET_POSITION, TYPE_POSITION_LABEL, type TypePosition } from "~/constants/positions";

/**
 * Mise en position conventionnelle d'un agent (CCN art. 76–80). Le dossier est
 * soumis par la RH puis approuvé par le DG : rien n'est appliqué à la création.
 *
 * Le **type** commande l'organisme d'accueil (détachement) et le consentement
 * de l'agent — sauf détachement d'office, qui en dispense ainsi que du préavis
 * de trois mois. Les conditions d'ancienneté et de durée sont vérifiées par
 * l'API : on affiche son 422.
 */
const props = defineProps<{ open: boolean; agentId?: number }>();
const emit = defineEmits<{ "update:open": [boolean]; created: [] }>();

const api = usePositionsApi();
const toast = useToast();
const handleError = useApiError();

const open = computed({ get: () => props.open, set: (v) => emit("update:open", v) });

const { options: agentOptions } = useResourceOptions("position-agents", () => useAgentsApi().list(), (a) =>
  agentNom(a),
);

/** État du formulaire (sans `null` : les contrôles n'acceptent que `string | undefined`). */
interface PositionForm {
  agent_id?: number;
  type: TypePosition;
  date_debut?: string;
  date_fin?: string;
  organisme_accueil?: string;
  consentement_agent?: boolean;
  detachement_office?: boolean;
  commentaire?: string;
  piece_path?: string;
}
const state = reactive<PositionForm>({ type: "detachement" });
const submitting = ref(false);

const typeOptions = TYPES_POSITION.map((t) => ({ label: TYPE_POSITION_LABEL[t], value: t }));
const estDetachement = computed(() => state.type === "detachement");
const effet = computed(() => EFFET_POSITION[state.type]);

function reset() {
  state.agent_id = props.agentId;
  state.type = "detachement";
  state.date_debut = undefined;
  state.date_fin = undefined;
  state.organisme_accueil = undefined;
  state.consentement_agent = true;
  state.detachement_office = false;
  state.commentaire = undefined;
  state.piece_path = undefined;
}

watch(open, (isOpen) => {
  if (isOpen) reset();
});

watch(
  () => state.type,
  (type) => {
    if (type !== "detachement") {
      state.organisme_accueil = undefined;
      state.detachement_office = false;
    }
  },
);

async function soumettre() {
  if (!state.agent_id || !state.date_debut || !state.date_fin) {
    toast.add({ title: "Agent et période sont requis.", color: "error" });
    return;
  }
  submitting.value = true;
  try {
    const payload: PositionConventionnelleInput = {
      agent_id: state.agent_id,
      type: state.type,
      date_debut: state.date_debut,
      date_fin: state.date_fin,
      organisme_accueil: state.organisme_accueil?.trim() || null,
      consentement_agent: state.consentement_agent ?? false,
      detachement_office: estDetachement.value ? state.detachement_office ?? false : null,
      commentaire: state.commentaire?.trim() || null,
      piece_path: state.piece_path?.trim() || null,
    };
    await api.create(payload);
    toast.add({ title: "Position soumise — en attente du Directeur Général", color: "success" });
    emit("created");
    open.value = false;
  } catch (err) {
    handleError(err);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <UModal v-model:open="open">
    <template #title>
      <BaseCardTitle icon="i-lucide-user-cog" title="Nouvelle position conventionnelle" />
    </template>
    <template #body>
      <div class="space-y-4">
        <UFormField label="Agent" name="agent_id" required>
          <USelectMenu
            v-model="state.agent_id"
            :items="agentOptions"
            value-key="value"
            :disabled="!!agentId"
            placeholder="Sélectionner un agent"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Position" name="type" required>
          <USelect v-model="state.type" :items="typeOptions" value-key="value" class="w-full" />
        </UFormField>

        <UAlert color="neutral" variant="subtle" icon="i-lucide-info" :description="effet" />

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Du" name="date_debut" required>
            <UInput v-model="state.date_debut" type="date" class="w-full" />
          </UFormField>
          <UFormField label="Au" name="date_fin" required>
            <UInput v-model="state.date_fin" type="date" class="w-full" />
          </UFormField>
        </div>

        <UFormField v-if="estDetachement" label="Organisme d'accueil" name="organisme_accueil">
          <UInput v-model="state.organisme_accueil" placeholder="Ex. Ministère des Finances" class="w-full" />
        </UFormField>

        <UFormField v-if="estDetachement" name="detachement_office">
          <USwitch
            v-model="state.detachement_office"
            label="Détachement d'office"
            description="Dispense du consentement de l'agent et du préavis de trois mois."
          />
        </UFormField>

        <UFormField v-if="!state.detachement_office" name="consentement_agent">
          <USwitch v-model="state.consentement_agent" label="Consentement de l'agent recueilli" />
        </UFormField>

        <UFormField label="Référence de la pièce" name="piece_path">
          <UInput v-model="state.piece_path" placeholder="Référence de l'acte ou de la demande" class="w-full" />
        </UFormField>

        <UFormField label="Commentaire" name="commentaire">
          <UTextarea v-model="state.commentaire" :rows="3" class="w-full" />
        </UFormField>

        <div class="flex justify-end gap-2 pt-2">
          <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
          <UButton :loading="submitting" @click="soumettre">Soumettre</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
