<script setup lang="ts">
import type { Evaluation } from "~/schemas/evaluation";
import type { AvisHierarchiqueInput } from "~/schemas/avis-hierarchique";
import type { NiveauAvisHierarchique } from "~/constants/evaluations";
import type { EtatNiveauAvis } from "~/utils/evaluationActions";

/**
 * Chaîne d'avis hiérarchiques d'une fiche (CCN art. 64) : chef de bureau → chef
 * de service → directeur → DG, le niveau `directeur` étant sauté quand la
 * direction est rattachée à la DG. La chaîne exacte vient du serveur
 * (`niveaux-requis`), calculée depuis l'affectation de l'agent.
 *
 * Deux règles tenues ici, faute de contrôle côté API : un niveau ne s'ouvre que
 * si le précédent a signé, et seul le rôle correspondant peut agir. La
 * signature est définitive (`PUT` renvoie 422 ensuite).
 */
const props = defineProps<{ evaluation: Evaluation }>();
const emit = defineEmits<{ changed: [] }>();

const api = useAvisHierarchiquesApi();
const acteur = useActeurEvaluation();
const toast = useToast();
const handleError = useApiError();

const id = computed(() => props.evaluation.id);

const { data: niveauxData, pending, refresh: refreshNiveaux } = useAsyncData(
  () => `evaluation-niveaux-requis-${id.value}`,
  () => api.niveauxRequis(id.value),
  { watch: [id] },
);
const niveaux = computed(() => niveauxData.value?.data ?? []);

const { data: avisData, refresh: refreshAvis } = useAsyncData(
  () => `evaluation-avis-${id.value}`,
  () => api.byEvaluation(id.value),
  { watch: [id] },
);
const avis = computed(() => avisData.value?.data ?? []);

const chaine = computed(() => chaineAvis(niveaux.value, avis.value, acteur.value));
const bloquant = computed(() => envoiRhBloque(niveaux.value, avis.value));

async function recharger() {
  await Promise.all([refreshNiveaux(), refreshAvis()]);
  emit("changed");
}

// — Saisie d'un avis ———————————————————————————————————————————
const open = ref(false);
const busy = ref(false);
const courant = ref<EtatNiveauAvis | null>(null);
/** État du formulaire (sans `null` : les contrôles n'acceptent que `string | undefined`). */
interface AvisForm {
  niveau: NiveauAvisHierarchique;
  avis?: string;
  approuve?: boolean;
  observations?: string;
}
const form = reactive<AvisForm>({ niveau: "chef_bureau", avis: "", approuve: true, observations: "" });

function ouvrir(etat: EtatNiveauAvis) {
  courant.value = etat;
  form.niveau = etat.niveau;
  form.avis = etat.avis?.avis ?? "";
  form.approuve = etat.avis?.approuve ?? true;
  form.observations = etat.avis?.observations ?? "";

  open.value = true;
}

async function enregistrer() {
  const etat = courant.value;
  if (!etat) return;
  busy.value = true;
  try {
    const payload: AvisHierarchiqueInput = {
      niveau: form.niveau,
      avis: form.avis?.trim() || null,
      approuve: form.approuve,
      observations: form.observations?.trim() || null,
    };
    if (etat.avis) await api.update(etat.avis.id, payload);
    else await api.poster(id.value, payload);
    toast.add({ title: "Avis enregistré", color: "success" });
    open.value = false;
    await recharger();
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

async function signer(etat: EtatNiveauAvis) {
  if (!etat.avis) return;
  if (!confirm("Signer cet avis ? Il ne sera plus modifiable.")) return;
  busy.value = true;
  try {
    await api.signer(etat.avis.id);
    toast.add({ title: "Avis signé", color: "success" });
    await recharger();
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div>
    <BaseCardTitle icon="i-lucide-git-merge" title="Avis hiérarchiques" />

    <div v-if="pending" class="mt-4 text-sm text-muted">Chargement de la chaîne…</div>

    <p v-else-if="!niveaux.length" class="mt-4 text-sm text-muted">
      Aucune chaîne d'avis n'a pu être déterminée : l'agent n'a pas d'affectation exploitable.
    </p>

    <template v-else>
      <UAlert
        v-if="bloquant"
        class="mt-4"
        color="warning"
        variant="subtle"
        icon="i-lucide-alert-triangle"
        title="Transmission à la RH bloquée"
        description="Tous les avis requis doivent être signés avant l'envoi en validation RH."
      />

      <ol class="mt-4 space-y-4">
        <li v-for="etat in chaine" :key="etat.niveau" class="flex gap-3">
          <span
            class="flex size-8 shrink-0 items-center justify-center rounded-full"
            :class="
              etat.signe
                ? 'bg-success/15 text-success'
                : etat.deverrouille
                  ? 'bg-warning/15 text-warning'
                  : 'bg-elevated text-dimmed'
            "
          >
            <UIcon
              :name="etat.signe ? 'i-lucide-check' : etat.deverrouille ? 'i-lucide-clock' : 'i-lucide-lock'"
              class="size-4"
            />
          </span>

          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between gap-2">
              <p class="text-sm font-medium text-highlighted">{{ etat.label }}</p>
              <UBadge v-if="etat.avis?.approuve != null" :color="etat.avis.approuve ? 'success' : 'error'" variant="subtle" size="sm">
                {{ etat.avis.approuve ? "Favorable" : "Défavorable" }}
              </UBadge>
            </div>
            <p v-if="etat.avis?.avis" class="mt-1 text-sm text-default">« {{ etat.avis.avis }} »</p>
            <p v-if="etat.avis?.observations" class="text-xs text-muted">{{ etat.avis.observations }}</p>
            <p v-if="etat.signe" class="text-xs text-muted">
              Signé le {{ formatDateTime(etat.avis?.date_signature) }}
              <span v-if="etat.avis?.signe_par?.name"> par {{ etat.avis.signe_par.name }}</span>
            </p>

            <div v-if="etat.actionnable" class="mt-2 flex gap-2">
              <UButton size="xs" :icon="etat.avis ? 'i-lucide-pencil' : 'i-lucide-plus'" :loading="busy" @click="ouvrir(etat)">
                {{ etat.avis ? "Modifier mon avis" : "Donner mon avis" }}
              </UButton>
              <UButton
                v-if="etat.avis"
                size="xs"
                color="primary"
                variant="soft"
                icon="i-lucide-pen-tool"
                :loading="busy"
                @click="signer(etat)"
              >
                Signer
              </UButton>
            </div>
            <p v-else-if="!etat.deverrouille" class="mt-1 text-xs text-muted">
              En attente de la signature du niveau précédent.
            </p>
          </div>
        </li>
      </ol>
    </template>

    <UModal v-model:open="open" title="Avis hiérarchique">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Sens de l'avis" name="approuve">
            <USelect
              v-model="form.approuve"
              :items="[
                { label: 'Favorable', value: true },
                { label: 'Défavorable', value: false },
              ]"
              value-key="value"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Avis" name="avis">
            <UTextarea v-model="form.avis" :rows="4" placeholder="Appréciation (facultative, 2000 caractères max.)" class="w-full" />
          </UFormField>
          <UFormField label="Observations" name="observations">
            <UTextarea v-model="form.observations" :rows="3" class="w-full" />
          </UFormField>
          <p class="text-xs text-muted">
            L'enregistrement ne signe pas l'avis : la signature est une action distincte et définitive.
          </p>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
            <UButton :loading="busy" @click="enregistrer">Enregistrer</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
