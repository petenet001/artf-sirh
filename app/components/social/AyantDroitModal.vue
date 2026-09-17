<script setup lang="ts">
import type { AyantDroit, AyantDroitInput } from "~/schemas/ayant-droit";
import type { GENRES } from "~/constants/enums";
import { QUALITES_AGE_AYANT_DROIT, TYPES_AYANT_DROIT } from "~/constants/enums";
import {
  agentNom,
  exigeQualiteAge,
  LIENS_PAR_TYPE,
  LIEN_JURIDIQUE_LABEL,
  QUALITE_AGE_LABEL,
  TYPE_AYANT_DROIT_LABEL,
  type LienJuridiqueAyantDroit,
  type QualiteAgeAyantDroit,
  type TypeAyantDroit,
} from "~/constants/social";

/**
 * Ayant droit d'un agent (CCN art. 58–59). Le **type** commande les liens
 * juridiques recevables et l'affichage de la qualité d'âge, qui ne concerne
 * que les enfants et fixe l'âge limite de prise en charge (16, 17 ou 21 ans).
 *
 * Les règles de cumul (un seul conjoint actif, deux tutelles au plus) sont
 * tenues par l'API : on affiche son 422 plutôt que de les rejouer.
 */
const props = defineProps<{ open: boolean; ayantDroit?: AyantDroit | null; agentId?: number }>();
const emit = defineEmits<{ "update:open": [boolean]; saved: [] }>();

const api = useAyantsDroitApi();
const toast = useToast();
const handleError = useApiError();

const open = computed({ get: () => props.open, set: (v) => emit("update:open", v) });
const edition = computed(() => !!props.ayantDroit);

const { options: agentOptions } = useResourceOptions("ayant-droit-agents", () => useAgentsApi().list(), (a) =>
  agentNom(a),
);

/** État du formulaire (sans `null` : les contrôles n'acceptent que `string | undefined`). */
interface AyantDroitForm {
  agent_id?: number;
  type: TypeAyantDroit;
  nom: string;
  prenom: string;
  date_naissance?: string;
  sexe?: (typeof GENRES)[number];
  lien_juridique?: LienJuridiqueAyantDroit;
  qualite_age?: QualiteAgeAyantDroit;
  date_debut?: string;
  date_fin?: string;
  actif?: boolean;
}
const state = reactive<AyantDroitForm>({ type: "enfant", nom: "", prenom: "" });
const submitting = ref(false);

const typeOptions = TYPES_AYANT_DROIT.map((t) => ({ label: TYPE_AYANT_DROIT_LABEL[t], value: t }));
const lienOptions = computed(() =>
  LIENS_PAR_TYPE[state.type].map((l) => ({ label: LIEN_JURIDIQUE_LABEL[l], value: l })),
);
const qualiteOptions = QUALITES_AGE_AYANT_DROIT.map((q) => ({ label: QUALITE_AGE_LABEL[q], value: q }));
const qualiteAttendue = computed(() => exigeQualiteAge(state.type));

function reset() {
  const a = props.ayantDroit;
  state.agent_id = a?.agent_id ?? props.agentId;
  state.type = (a?.type as TypeAyantDroit) ?? "enfant";
  state.nom = a?.nom ?? "";
  state.prenom = a?.prenom ?? "";
  state.date_naissance = a?.date_naissance ?? undefined;
  state.sexe = (a?.sexe as (typeof GENRES)[number]) ?? undefined;
  state.lien_juridique = (a?.lien_juridique as LienJuridiqueAyantDroit) ?? undefined;
  state.qualite_age = (a?.qualite_age as QualiteAgeAyantDroit) ?? "standard";
  state.date_debut = a?.date_debut ?? undefined;
  state.date_fin = a?.date_fin ?? undefined;
  state.actif = a?.actif ?? true;
}

watch(open, (isOpen) => {
  if (isOpen) reset();
});

// Changer de type invalide le lien juridique s'il n'est plus recevable.
watch(
  () => state.type,
  (type) => {
    if (state.lien_juridique && !LIENS_PAR_TYPE[type].includes(state.lien_juridique)) {
      state.lien_juridique = undefined;
    }
    if (!exigeQualiteAge(type)) state.qualite_age = undefined;
    else state.qualite_age = state.qualite_age ?? "standard";
  },
);

async function enregistrer() {
  if (!state.agent_id || !state.nom.trim() || !state.prenom.trim() || !state.date_naissance || !state.lien_juridique) {
    toast.add({ title: "Agent, identité, date de naissance et lien juridique sont requis.", color: "error" });
    return;
  }
  submitting.value = true;
  try {
    const payload: AyantDroitInput = {
      agent_id: state.agent_id,
      type: state.type,
      nom: state.nom.trim(),
      prenom: state.prenom.trim(),
      date_naissance: state.date_naissance,
      sexe: state.sexe ?? null,
      lien_juridique: state.lien_juridique,
      qualite_age: qualiteAttendue.value ? state.qualite_age ?? "standard" : null,
      date_debut: state.date_debut || null,
      date_fin: state.date_fin || null,
      actif: state.actif ?? true,
    };
    if (props.ayantDroit) await api.update(props.ayantDroit.id, payload);
    else await api.create(payload);
    toast.add({ title: edition.value ? "Ayant droit mis à jour" : "Ayant droit ajouté", color: "success" });
    emit("saved");
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
      <BaseCardTitle icon="i-lucide-users" :title="edition ? 'Modifier l\'ayant droit' : 'Nouvel ayant droit'" />
    </template>
    <template #body>
      <div class="space-y-4">
        <UFormField label="Agent" name="agent_id" required>
          <USelectMenu
            v-model="state.agent_id"
            :items="agentOptions"
            value-key="value"
            :disabled="!!agentId || edition"
            placeholder="Sélectionner un agent"
            class="w-full"
          />
        </UFormField>

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Qualité" name="type" required>
            <USelect v-model="state.type" :items="typeOptions" value-key="value" class="w-full" />
          </UFormField>
          <UFormField label="Lien juridique" name="lien_juridique" required>
            <USelect v-model="state.lien_juridique" :items="lienOptions" value-key="value" class="w-full" />
          </UFormField>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Nom" name="nom" required>
            <UInput v-model="state.nom" class="w-full" />
          </UFormField>
          <UFormField label="Prénom" name="prenom" required>
            <UInput v-model="state.prenom" class="w-full" />
          </UFormField>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Date de naissance" name="date_naissance" required>
            <UInput v-model="state.date_naissance" type="date" class="w-full" />
          </UFormField>
          <UFormField label="Sexe" name="sexe">
            <USelect
              v-model="state.sexe"
              :items="[
                { label: 'Masculin', value: 'M' },
                { label: 'Féminin', value: 'F' },
              ]"
              value-key="value"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField
          v-if="qualiteAttendue"
          label="Régime d'âge"
          name="qualite_age"
          help="Fixe l'âge limite de prise en charge (16, 17 ou 21 ans)."
        >
          <USelect v-model="state.qualite_age" :items="qualiteOptions" value-key="value" class="w-full" />
        </UFormField>

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Pris en charge depuis" name="date_debut">
            <UInput v-model="state.date_debut" type="date" class="w-full" />
          </UFormField>
          <UFormField label="Jusqu'au" name="date_fin">
            <UInput v-model="state.date_fin" type="date" class="w-full" />
          </UFormField>
        </div>

        <UFormField name="actif">
          <USwitch v-model="state.actif" label="Ayant droit actif" />
        </UFormField>

        <div class="flex justify-end gap-2 pt-2">
          <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
          <UButton :loading="submitting" @click="enregistrer">Enregistrer</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
