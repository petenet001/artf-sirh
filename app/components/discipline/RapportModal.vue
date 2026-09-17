<script setup lang="ts">
import type { SanctionInput } from "~/schemas/sanction";
import type { TypeSanction } from "~/schemas/type-sanction";
import { agentNom, exigeIndemnite, exigeNbJours } from "~/constants/discipline";

/**
 * Dépôt d'un rapport disciplinaire (CCN art. 90). C'est le point d'entrée du
 * circuit : le N+1 (ou la RH) expose les faits, la RH instruira, le DG
 * prononcera.
 *
 * Le **type** commande deux champs : une mise à pied exige une durée de 1 à 8
 * jours, un licenciement expose le choix de l'indemnité. Le périmètre des
 * agents proposables est tenu par l'API (un chef ne vise que son équipe) : on
 * ne le rejoue pas, on affiche le 422.
 */
const props = defineProps<{ open: boolean; agentId?: number }>();
const emit = defineEmits<{ "update:open": [boolean]; created: [] }>();

const api = useSanctionsApi();
const typesApi = useTypesSanctionsApi();
const toast = useToast();
const handleError = useApiError();

const open = computed({ get: () => props.open, set: (v) => emit("update:open", v) });

const { data: typesData } = useAsyncData("types-sanctions-actifs", () => typesApi.list({ actif: true }));
const types = computed(() => typesData.value?.data ?? []);
const typeOptions = computed(() => types.value.map((t) => ({ label: t.nom, value: t.id })));

const { options: agentOptions } = useResourceOptions("discipline-agents", () => useAgentsApi().list(), (a) =>
  agentNom(a),
);

/** État du formulaire (sans `null` : les contrôles n'acceptent que `string | undefined`). */
interface RapportForm {
  agent_id?: number;
  type_sanction_id?: number;
  motif: string;
  date_faits?: string;
  nb_jours?: number;
  avec_indemnite?: boolean;
}
const state = reactive<RapportForm>({ motif: "" });
const submitting = ref(false);

const typeChoisi = computed<TypeSanction | undefined>(() =>
  types.value.find((t) => t.id === state.type_sanction_id),
);
const dureeRequise = computed(() => exigeNbJours(typeChoisi.value));
const indemniteAttendue = computed(() => exigeIndemnite(typeChoisi.value));

function reset() {
  state.agent_id = props.agentId;
  state.type_sanction_id = undefined;
  state.motif = "";
  state.date_faits = undefined;
  state.nb_jours = undefined;
  state.avec_indemnite = true;
}

watch(open, (isOpen) => {
  if (isOpen) reset();
});

async function soumettre() {
  if (!state.agent_id || !state.type_sanction_id || !state.date_faits || state.motif.trim().length < 3) {
    toast.add({ title: "Agent, type, date des faits et motif sont requis.", color: "error" });
    return;
  }
  if (dureeRequise.value && !state.nb_jours) {
    toast.add({ title: "Une mise à pied exige une durée de 1 à 8 jours.", color: "error" });
    return;
  }
  submitting.value = true;
  try {
    const payload: SanctionInput = {
      agent_id: state.agent_id,
      type_sanction_id: state.type_sanction_id,
      motif: state.motif.trim(),
      date_faits: state.date_faits,
      nb_jours: dureeRequise.value ? state.nb_jours : null,
      avec_indemnite: indemniteAttendue.value ? state.avec_indemnite ?? true : null,
    };
    await api.create(payload);
    toast.add({ title: "Rapport disciplinaire déposé", color: "success" });
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
      <BaseCardTitle icon="i-lucide-file-warning" title="Nouveau rapport disciplinaire" />
    </template>
    <template #body>
      <div class="space-y-4">
        <UFormField label="Agent concerné" name="agent_id" required>
          <USelectMenu
            v-model="state.agent_id"
            :items="agentOptions"
            value-key="value"
            :disabled="!!agentId"
            placeholder="Sélectionner un agent"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Sanction envisagée" name="type_sanction_id" required>
          <USelect v-model="state.type_sanction_id" :items="typeOptions" value-key="value" class="w-full" />
        </UFormField>

        <UFormField label="Date des faits" name="date_faits" required>
          <UInput v-model="state.date_faits" type="date" class="w-full" />
        </UFormField>

        <UFormField
          v-if="dureeRequise"
          label="Durée de la mise à pied"
          name="nb_jours"
          required
          help="1 à 8 jours (art. 90)."
        >
          <UInputNumber v-model="state.nb_jours" :min="1" :max="8" class="w-full" />
        </UFormField>

        <UFormField v-if="indemniteAttendue" name="avec_indemnite">
          <USwitch v-model="state.avec_indemnite" label="Licenciement avec indemnité" />
        </UFormField>

        <UFormField label="Exposé des faits" name="motif" required>
          <UTextarea v-model="state.motif" :rows="5" placeholder="Circonstances et faits reprochés" class="w-full" />
        </UFormField>

        <p class="text-xs text-muted">
          Le dossier partira en instruction RH. Pensez à joindre les pièces : l'instruction est
          refusée tant qu'aucune pièce n'est au dossier (art. 91).
        </p>

        <div class="flex justify-end gap-2 pt-2">
          <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
          <UButton :loading="submitting" @click="soumettre">Déposer le rapport</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
