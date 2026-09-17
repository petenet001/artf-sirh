<script setup lang="ts">
import type { ReclassementInput } from "~/schemas/reclassement";
import { TYPES_RECLASSEMENT, MOTIFS_RECONVERSION } from "~/constants/enums";
import {
  agentNom,
  CHAMPS_PAR_TYPE,
  MOTIF_RECONVERSION_LABEL,
  TYPE_RECLASSEMENT_LABEL,
  type TypeReclassement,
} from "~/constants/reclassements";

/**
 * Dépôt d'un dossier de reclassement (CCN art. 73–75). Le **type** commande le
 * formulaire : diplôme pour l'art. 73, classe cible pour le 74a, rien pour le
 * 74b, motif + fonction pour le 75 (cf. `CHAMPS_PAR_TYPE`).
 *
 * Les règles d'éligibilité (âge, ancienneté, années dans la classe, diplôme au
 * dossier) sont tenues par l'API : on n'en rejoue aucune ici, on affiche le 422.
 * `piece_path` est une **référence texte**, pas un téléversement.
 */
const props = defineProps<{ open: boolean; agentId?: number }>();
const emit = defineEmits<{ "update:open": [boolean]; created: [] }>();

const api = useReclassementsApi();
const toast = useToast();
const handleError = useApiError();

const open = computed({ get: () => props.open, set: (v) => emit("update:open", v) });

const { options: agentOptions } = useResourceOptions("reclassement-agents", () => useAgentsApi().list(), (a) =>
  agentNom(a),
);
const { options: diplomeOptions } = useResourceOptions("reclassement-diplomes", () => useDiplomesApi().list());
const { options: classeOptions } = useResourceOptions(
  "reclassement-classes",
  () => useGrilleClassesApi().list(),
  (c) => [c.categorie?.nom, c.grade?.nom].filter(Boolean).join(" · ") || `Classe #${c.id}`,
);
const { options: fonctionOptions } = useResourceOptions("reclassement-fonctions", () => useFonctionsApi().list());

/** État du formulaire (sans `null` : les contrôles n'acceptent que `string | undefined`). */
interface ReclassementForm {
  agent_id?: number;
  type: TypeReclassement;
  motif: string;
  diplome_id?: number;
  classe_cible_id?: number;
  fonction_cible_id?: number;
  motif_reconversion?: (typeof MOTIFS_RECONVERSION)[number];
  piece_path?: string;
}
const state = reactive<ReclassementForm>({ type: "reclassement_formation", motif: "" });
const submitting = ref(false);

const champs = computed(() => CHAMPS_PAR_TYPE[state.type]);
// Art. 75 pour maladie : une pièce du médecin agréé est attendue (référence texte).
const pieceAttendue = computed(() => state.type === "reconversion" && state.motif_reconversion === "maladie");

const typeOptions = TYPES_RECLASSEMENT.map((t) => ({ label: TYPE_RECLASSEMENT_LABEL[t], value: t }));
const motifOptions = MOTIFS_RECONVERSION.map((m) => ({ label: MOTIF_RECONVERSION_LABEL[m], value: m }));

function reset() {
  state.agent_id = props.agentId;
  state.type = "reclassement_formation";
  state.motif = "";
  state.diplome_id = undefined;
  state.classe_cible_id = undefined;
  state.fonction_cible_id = undefined;
  state.motif_reconversion = undefined;
  state.piece_path = undefined;
}

watch(open, (isOpen) => {
  if (isOpen) reset();
});

// Un changement de type remet à zéro les champs qui ne le concernent plus.
watch(
  () => state.type,
  () => {
    if (!champs.value.diplome) state.diplome_id = undefined;
    if (!champs.value.classeCible) state.classe_cible_id = undefined;
    if (!champs.value.fonctionCible) state.fonction_cible_id = undefined;
    if (!champs.value.motifReconversion) state.motif_reconversion = undefined;
  },
);

async function soumettre() {
  if (!state.agent_id || state.motif.trim().length < 10) {
    toast.add({ title: "Agent et motif (10 caractères min.) sont requis.", color: "error" });
    return;
  }
  submitting.value = true;
  try {
    const payload: ReclassementInput = {
      agent_id: state.agent_id,
      type: state.type,
      motif: state.motif.trim(),
      diplome_id: state.diplome_id ?? null,
      classe_cible_id: state.classe_cible_id ?? null,
      fonction_cible_id: state.fonction_cible_id ?? null,
      motif_reconversion: state.motif_reconversion ?? null,
      piece_path: state.piece_path?.trim() || null,
    };
    await api.create(payload);
    toast.add({ title: "Dossier de reclassement créé", color: "success" });
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
      <BaseCardTitle icon="i-lucide-arrow-up-narrow-wide" title="Nouveau reclassement" />
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

        <UFormField label="Type de reclassement" name="type" required>
          <USelect v-model="state.type" :items="typeOptions" value-key="value" class="w-full" />
        </UFormField>

        <UFormField
          v-if="champs.diplome"
          label="Diplôme obtenu"
          name="diplome_id"
          help="Le diplôme doit déjà figurer au dossier de l'agent."
        >
          <USelectMenu v-model="state.diplome_id" :items="diplomeOptions" value-key="value" class="w-full" />
        </UFormField>

        <UFormField
          v-if="champs.motifReconversion"
          label="Motif réglementaire"
          name="motif_reconversion"
          required
        >
          <USelect v-model="state.motif_reconversion" :items="motifOptions" value-key="value" class="w-full" />
        </UFormField>

        <UFormField v-if="champs.fonctionCible" label="Fonction de reconversion" name="fonction_cible_id">
          <USelectMenu v-model="state.fonction_cible_id" :items="fonctionOptions" value-key="value" class="w-full" />
        </UFormField>

        <UFormField
          v-if="champs.classeCible"
          label="Classe visée"
          name="classe_cible_id"
          :help="state.type === 'reconversion' ? 'Facultative pour une reconversion.' : undefined"
        >
          <USelectMenu v-model="state.classe_cible_id" :items="classeOptions" value-key="value" class="w-full" />
        </UFormField>

        <UFormField
          v-if="pieceAttendue"
          label="Référence de la pièce médicale"
          name="piece_path"
          help="Référence du certificat du médecin agréé (texte — pas de téléversement côté API)."
        >
          <UInput v-model="state.piece_path" placeholder="Ex. CM-2026-014" class="w-full" />
        </UFormField>

        <UFormField label="Motif" name="motif" required>
          <UTextarea v-model="state.motif" :rows="4" placeholder="Justification du reclassement (10 caractères min.)" class="w-full" />
        </UFormField>

        <div class="flex justify-end gap-2 pt-2">
          <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
          <UButton :loading="submitting" @click="soumettre">Créer le dossier</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
