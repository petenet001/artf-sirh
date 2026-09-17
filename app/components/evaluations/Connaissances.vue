<script setup lang="ts">
import type { Evaluation } from "~/schemas/evaluation";
import type { ConnaissanceComplementaireInput } from "~/schemas/connaissance-complementaire";
import { TYPES_CONNAISSANCE } from "~/constants/enums";
import { TYPE_CONNAISSANCE_LABEL, type TypeConnaissance } from "~/constants/evaluations";

/**
 * Besoins de formation relevés pendant l'évaluation. Ouverts à tout détenteur
 * de `consulter-evaluations` côté API : on les propose au notateur et à l'agent
 * de la fiche, qui sont les seuls à savoir ce qui manque.
 */
const props = defineProps<{ evaluation: Evaluation }>();

const api = useEvaluationsApi();
const acteur = useActeurEvaluation();
const toast = useToast();
const handleError = useApiError();

const id = computed(() => props.evaluation.id);

const { data, pending, refresh } = useAsyncData(
  () => `evaluation-connaissances-${id.value}`,
  () => api.connaissances(id.value),
  { watch: [id] },
);
const connaissances = computed(() => data.value?.data ?? []);

const editable = computed(
  () =>
    estNotateur(props.evaluation, acteur.value) ||
    estEvalue(props.evaluation, acteur.value) ||
    acteur.value.estRh,
);

const open = ref(false);
const busy = ref(false);
/** État du formulaire (sans `null` : les contrôles n'acceptent que `string | undefined`). */
interface ConnaissanceForm {
  type: ConnaissanceComplementaireInput["type"];
  domaine: string;
  description?: string;
  urgent?: boolean;
}
const form = reactive<ConnaissanceForm>({
  type: "formation",
  domaine: "",
  description: "",
  urgent: false,
});

const typeOptions = TYPES_CONNAISSANCE.map((t) => ({ label: TYPE_CONNAISSANCE_LABEL[t], value: t }));

function ouvrir() {
  form.type = "formation";
  form.domaine = "";
  form.description = "";
  form.urgent = false;
  open.value = true;
}

async function ajouter() {
  if (!form.domaine.trim()) {
    toast.add({ title: "Domaine requis.", color: "error" });
    return;
  }
  busy.value = true;
  try {
    await api.ajouterConnaissance(id.value, {
      type: form.type,
      domaine: form.domaine.trim(),
      description: form.description?.trim() || null,
      urgent: form.urgent ?? false,
    });
    toast.add({ title: "Besoin de formation ajouté", color: "success" });
    open.value = false;
    await refresh();
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

async function supprimer(connaissanceId: number) {
  if (!confirm("Retirer ce besoin de formation ?")) return;
  busy.value = true;
  try {
    await api.supprimerConnaissance(connaissanceId);
    await refresh();
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between gap-3">
      <BaseCardTitle icon="i-lucide-book-open" title="Besoins de formation" />
      <UButton v-if="editable" size="xs" color="neutral" variant="soft" icon="i-lucide-plus" @click="ouvrir">
        Ajouter
      </UButton>
    </div>

    <div v-if="pending" class="mt-4 text-sm text-muted">Chargement…</div>
    <p v-else-if="!connaissances.length" class="mt-4 text-sm text-muted">
      Aucun besoin de formation relevé sur cette fiche.
    </p>
    <ul v-else class="mt-4 space-y-3">
      <li v-for="c in connaissances" :key="c.id" class="flex items-start justify-between gap-3 border-b border-default pb-3 last:border-0 last:pb-0">
        <div class="min-w-0">
          <p class="text-sm font-medium text-highlighted">
            {{ c.domaine }}
            <UBadge v-if="c.urgent" color="warning" variant="subtle" size="sm" class="ml-1">Urgent</UBadge>
          </p>
          <p class="text-xs text-muted">{{ TYPE_CONNAISSANCE_LABEL[c.type as TypeConnaissance] }}</p>
          <p v-if="c.description" class="mt-1 text-sm text-default">{{ c.description }}</p>
        </div>
        <UButton
          v-if="editable"
          size="xs"
          color="neutral"
          variant="ghost"
          icon="i-lucide-trash-2"
          :loading="busy"
          @click="supprimer(c.id)"
        />
      </li>
    </ul>

    <UModal v-model:open="open" title="Besoin de formation">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Nature" name="type">
            <USelect v-model="form.type" :items="typeOptions" value-key="value" class="w-full" />
          </UFormField>
          <UFormField label="Domaine" name="domaine" required>
            <UInput v-model="form.domaine" placeholder="Ex. Gestion de projet" class="w-full" />
          </UFormField>
          <UFormField label="Description" name="description">
            <UTextarea v-model="form.description" :rows="3" class="w-full" />
          </UFormField>
          <UFormField name="urgent">
            <USwitch v-model="form.urgent" label="Besoin urgent" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
            <UButton :loading="busy" @click="ajouter">Ajouter</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
