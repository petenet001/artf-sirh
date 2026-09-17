<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import {
  sessionEvaluationInputSchema,
  type SessionEvaluation,
  type SessionEvaluationInput,
} from "~/schemas/session-evaluation";

/**
 * Ouverture (ou modification) d'une session d'évaluation.
 *
 * ⚠️ Ouvrir une session **génère immédiatement** les fiches des agents
 * éligibles : statut `actif`, prise de service renseignée, cycle de 24 mois
 * écoulé, parité d'année et semestre si renseignés, et N+1 identifiable sur le
 * poste dominant des 24 derniers mois (CCN art. 62). Les agents sans N+1 ne
 * reçoivent pas de fiche — ils sont listés dans le détail de la session.
 */
const props = defineProps<{ open: boolean; session?: SessionEvaluation | null }>();
const emit = defineEmits<{ "update:open": [boolean]; saved: [] }>();

const api = useSessionsEvaluationApi();
const toast = useToast();
const handleError = useApiError();

const open = computed({ get: () => props.open, set: (v) => emit("update:open", v) });
const edition = computed(() => !!props.session);

interface SessionForm {
  debut_session?: string;
  fin_session?: string;
  type_annee?: "paire" | "impaire";
  semestre?: number;
  description?: string;
}
const state = reactive<SessionForm>({});
const submitting = ref(false);

const TOUS = undefined;
const anneeOptions = [
  { label: "Toutes les années d'embauche", value: TOUS },
  { label: "Embauchés une année paire", value: "paire" as const },
  { label: "Embauchés une année impaire", value: "impaire" as const },
];
const semestreOptions = [
  { label: "Tous les semestres d'embauche", value: TOUS },
  { label: "1ᵉʳ semestre (janvier – juin)", value: 1 },
  { label: "2ᵉ semestre (juillet – décembre)", value: 2 },
];

function reset() {
  const s = props.session;
  state.debut_session = s?.debut_session ?? undefined;
  state.fin_session = s?.fin_session ?? undefined;
  state.type_annee = s?.type_annee ?? undefined;
  state.semestre = s?.semestre ?? undefined;
  state.description = s?.description ?? undefined;
}

watch(open, (isOpen) => {
  if (isOpen) reset();
});

async function onSubmit(event: FormSubmitEvent<SessionEvaluationInput>) {
  submitting.value = true;
  try {
    if (props.session) await api.update(props.session.id, event.data);
    else await api.create(event.data);
    toast.add({
      title: edition.value ? "Session mise à jour" : "Session ouverte — fiches générées",
      color: "success",
    });
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
      <BaseCardTitle
        icon="i-lucide-calendar-range"
        :title="edition ? 'Modifier la session' : 'Ouvrir une session d\'évaluation'"
      />
    </template>
    <template #body>
      <UForm :schema="sessionEvaluationInputSchema" :state="state" class="space-y-4" @submit="onSubmit">
        <UAlert
          v-if="!edition"
          color="primary"
          variant="subtle"
          icon="i-lucide-info"
          title="Les fiches sont générées à l'ouverture"
          description="Un agent reçoit une fiche s'il est actif, a une prise de service, a bouclé son cycle de 24 mois et a un N+1 identifiable sur son poste dominant (CCN art. 62)."
        />

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Début de session" name="debut_session" required>
            <UInput v-model="state.debut_session" type="date" class="w-full" />
          </UFormField>
          <UFormField label="Fin de session" name="fin_session">
            <UInput v-model="state.fin_session" type="date" class="w-full" />
          </UFormField>
        </div>

        <UFormField label="Parité d'année d'embauche" name="type_annee" help="Laisser vide pour ne pas filtrer.">
          <USelect v-model="state.type_annee" :items="anneeOptions" value-key="value" class="w-full" />
        </UFormField>

        <UFormField label="Semestre d'embauche" name="semestre" help="Laisser vide pour ne pas filtrer.">
          <USelect v-model="state.semestre" :items="semestreOptions" value-key="value" class="w-full" />
        </UFormField>

        <UFormField label="Description" name="description">
          <UTextarea v-model="state.description" placeholder="Ex. Notation 2026 — cycle pair" class="w-full" />
        </UFormField>

        <div class="flex justify-end gap-2 pt-2">
          <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
          <UButton type="submit" :loading="submitting">{{ edition ? "Enregistrer" : "Ouvrir la session" }}</UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
