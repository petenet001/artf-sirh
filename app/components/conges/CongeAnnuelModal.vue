<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import { congeAnnuelInputSchema, type CongeAnnuelInput } from "~/schemas/conge-annuel";
import type { DemandeConge } from "~/schemas/demande-conge";
import { agentNom } from "~/constants/conges";
import { ORIGINE_LABEL, estWeekEnd, type OrigineCongeAnnuel } from "~/constants/conges-annuels";

/**
 * Proposition de congé annuel (`POST /conges-annuels/demandes`, note FE §2c).
 *
 * **Un seul champ : la date de départ.** Le serveur pose tout le solde de
 * l'année et calcule la fin, la reprise et le nombre de jours — on ne les
 * affiche donc pas en saisie, seulement **après** la réponse, en lecture seule.
 * Avant, on montre le solde : c'est la durée qui sera posée.
 *
 * `origine` vient de l'état de la campagne (`origineDepot`) : proposition de
 * campagne pendant l'ouverture, droit acquis après la clôture ensuite. Les
 * refus métier (week-end, férié, solde nul, chevauchement, moins de 12 mois)
 * reviennent en 422 et passent par `useApiError`.
 *
 * Sans `agentId`, la modale propose de choisir l'agent (RH qui saisit pour un
 * tiers) — ce qui suppose `consulter-agents`.
 */
const props = defineProps<{
  open: boolean;
  origine: OrigineCongeAnnuel;
  /** Agent imposé (proposition pour soi). */
  agentId?: number | null;
  annee: number;
}>();
const emit = defineEmits<{ "update:open": [boolean]; created: [DemandeConge] }>();

const auth = useAuthStore();
const toast = useToast();
const handleError = useApiError();
const api = useCongesAnnuelsApi();
const agentsApi = useAgentsApi();

const open = computed({ get: () => props.open, set: (v) => emit("update:open", v) });
const pourTiers = computed(() => !props.agentId);

const { data: agentsData } = useAsyncData("conge-annuel-agents-select", () =>
  auth.can("consulter-agents") ? agentsApi.list() : Promise.resolve(null),
);
const agentOptions = computed(() =>
  (agentsData.value?.data ?? []).map((a) => ({ label: agentNom(a), value: a.id })),
);

interface PropositionForm {
  agent_id?: number;
  date_debut?: string;
  motif?: string;
}
const state = reactive<PropositionForm>({});
const submitting = ref(false);
const resultat = ref<DemandeConge | null>(null);

// Solde de l'agent visé : la durée qui sera posée d'un bloc.
const agentVise = computed(() => props.agentId ?? state.agent_id ?? 0);
const { data: soldeData, pending: soldePending } = useAsyncData(
  () => `conge-annuel-solde-${agentVise.value}-${props.annee}`,
  () => (props.open && agentVise.value ? api.solde(agentVise.value, props.annee) : Promise.resolve(null)),
  { watch: [agentVise, () => props.open, () => props.annee] },
);
const solde = computed(() => soldeData.value?.data ?? null);
const jours = computed(() => Math.floor(solde.value?.solde_actuel ?? 0));

const departWeekEnd = computed(() => estWeekEnd(state.date_debut));

watch(open, (isOpen) => {
  if (!isOpen) return;
  state.agent_id = props.agentId ?? undefined;
  state.date_debut = undefined;
  state.motif = undefined;
  resultat.value = null;
});

async function onSubmit(event: FormSubmitEvent<CongeAnnuelInput>) {
  if (departWeekEnd.value) {
    toast.add({ title: "La date de départ doit être un jour ouvrable.", color: "error" });
    return;
  }
  submitting.value = true;
  try {
    const { data } = await api.demandes.create({ ...event.data, origine: props.origine });
    resultat.value = data;
    toast.add({ title: "Proposition enregistrée", color: "success" });
    emit("created", data);
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
        icon="i-lucide-palmtree"
        :title="origine === 'campagne' ? `Proposer le congé annuel ${annee}` : `Congé annuel ${annee} — ${ORIGINE_LABEL.apres_cloture.toLowerCase()}`"
      />
    </template>
    <template #body>
      <!-- Après la réponse : ce que le serveur a calculé, en lecture seule. -->
      <div v-if="resultat" class="space-y-4">
        <UAlert
          color="success"
          variant="subtle"
          icon="i-lucide-check-circle"
          title="Proposition enregistrée"
          :description="origine === 'campagne'
            ? 'Elle sera examinée par votre N+1 puis par la RH après la clôture de la campagne.'
            : 'Elle part directement chez votre N+1, puis à la RH.'"
        />
        <dl class="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <BaseDefItem label="Départ" :value="formatDateLong(resultat.date_debut)" />
          <BaseDefItem label="Dernier jour" :value="formatDateLong(resultat.date_fin)" />
          <BaseDefItem label="Reprise" :value="formatDateLong(resultat.date_reprise)" />
          <BaseDefItem label="Jours posés" :value="resultat.nb_jours != null ? `${resultat.nb_jours} j ouvrables` : null" />
        </dl>
        <div class="flex justify-end gap-2 pt-2">
          <UButton color="neutral" variant="soft" :to="`/conges/demandes/${resultat.id}`">Voir la demande</UButton>
          <UButton @click="open = false">Fermer</UButton>
        </div>
      </div>

      <UForm v-else :schema="congeAnnuelInputSchema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField v-if="pourTiers" label="Agent" name="agent_id">
          <USelectMenu
            v-model="state.agent_id"
            value-key="value"
            :items="agentOptions"
            placeholder="Sélectionner un agent"
            class="w-full"
          />
        </UFormField>

        <div v-if="agentVise" class="rounded-lg border border-default bg-elevated/50 p-4">
          <p class="text-xs font-medium uppercase tracking-wide text-muted">Durée qui sera posée</p>
          <p v-if="soldePending" class="mt-1 text-sm text-muted">Calcul du solde…</p>
          <template v-else-if="solde">
            <p class="mt-1 text-2xl font-semibold text-highlighted">{{ jours }} j ouvrables</p>
            <p class="text-xs text-muted">
              Tout le solde {{ annee }} est posé d'un bloc
              <template v-if="solde.jours_reportes">, dont {{ solde.jours_reportes }} j reportés de {{ annee - 1 }}</template>.
            </p>
          </template>
        </div>

        <UFormField
          label="Date de départ"
          name="date_debut"
          help="La fin et la date de reprise sont calculées à l'enregistrement (week-ends et jours fériés exclus)."
          :error="departWeekEnd ? 'Choisissez un jour ouvrable (ni samedi ni dimanche).' : undefined"
        >
          <UInput v-model="state.date_debut" type="date" class="w-full" />
        </UFormField>

        <UFormField label="Motif" name="motif">
          <UTextarea v-model="state.motif" placeholder="Optionnel" class="w-full" />
        </UFormField>

        <div class="flex justify-end gap-2 pt-2">
          <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
          <UButton type="submit" :loading="submitting" :disabled="!!solde && jours < 1">Proposer</UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
