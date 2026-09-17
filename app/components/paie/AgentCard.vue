<script setup lang="ts">
import type { PaieAffectation, PaieAffectationInput } from "~/schemas/paie-affectation";
import { formatMontant } from "~/constants/paie";

/**
 * Éléments de paie affectés à un agent, sur sa fiche : primes, indemnités et
 * retenues qui s'ajoutent à sa base.
 *
 * ⚠️ Les éléments **automatiques** (ancienneté art. 56, 13ᵉ mois, rentrée
 * scolaire, arbre de Noël) ne s'affectent pas : le lot mensuel les calcule seul
 * — l'API renvoie 422 si on essaie. Et une affectation déjà figée dans un lot
 * validé n'est plus modifiable.
 */
const props = defineProps<{ agentId: number }>();

const api = usePaieApi();
const auth = useAuthStore();
const toast = useToast();
const handleError = useApiError();

const peutGerer = computed(() => auth.can("gerer-salaires"));

const { data, pending, refresh } = useAsyncData(
  () => `agent-paie-affectations-${props.agentId}`,
  () => (props.agentId > 0 ? api.affectationsAgent(props.agentId) : Promise.resolve(null)),
  { watch: [() => props.agentId] },
);
const affectations = computed(() => data.value?.data ?? []);

const { data: elementsData } = useAsyncData("paie-elements-actifs", () => api.elements({ actif: true }));
const elements = computed(() => elementsData.value?.data ?? []);
const elementOptions = computed(() => elements.value.map((e) => ({ label: e.libelle, value: e.id })));

const open = ref(false);
const busy = ref(false);
const elementId = ref<number | undefined>(undefined);
const montant = ref<number | undefined>(undefined);
const quantite = ref<number | undefined>(undefined);
const dateDebut = ref<string | undefined>(undefined);
const dateFin = ref<string | undefined>(undefined);
const motif = ref("");

const elementChoisi = computed(() => elements.value.find((e) => e.id === elementId.value));
// Un montant est attendu quand l'élément est à montant fixe sans valeur par défaut.
const montantAttendu = computed(
  () => elementChoisi.value?.mode_calcul === "montant_fixe" && elementChoisi.value?.montant_defaut == null,
);
const quantiteAttendue = computed(
  () => elementChoisi.value?.periodicite === "journalier" || elementChoisi.value?.mode_calcul === "bareme_ccn",
);

function ouvrir() {
  elementId.value = undefined;
  montant.value = undefined;
  quantite.value = undefined;
  dateDebut.value = undefined;
  dateFin.value = undefined;
  motif.value = "";
  open.value = true;
}

async function affecter() {
  if (!elementId.value || !dateDebut.value) {
    toast.add({ title: "Élément et date de début sont requis.", color: "error" });
    return;
  }
  busy.value = true;
  try {
    const payload: PaieAffectationInput = {
      agent_id: props.agentId,
      paie_element_id: elementId.value,
      montant: montant.value ?? null,
      quantite: quantite.value ?? null,
      date_debut: dateDebut.value,
      date_fin: dateFin.value || null,
      motif: motif.value.trim() || null,
    };
    await api.affecter(payload);
    toast.add({ title: "Élément affecté", color: "success" });
    open.value = false;
    await refresh();
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

async function retirer(affectation: PaieAffectation) {
  if (!confirm("Retirer cet élément de paie ?")) return;
  busy.value = true;
  try {
    await api.supprimerAffectation(affectation.id);
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
    <div class="flex flex-wrap items-center justify-between gap-3">
      <BaseCardTitle icon="i-lucide-banknote" title="Éléments de paie" />
      <UButton v-if="peutGerer" size="xs" icon="i-lucide-plus" @click="ouvrir">Affecter</UButton>
    </div>
    <p class="mt-2 text-xs text-muted">
      Ancienneté, 13ᵉ mois, rentrée scolaire et arbre de Noël sont calculés par le lot mensuel : ils
      ne s'affectent pas ici.
    </p>

    <div v-if="pending" class="mt-4 text-sm text-muted">Chargement…</div>
    <p v-else-if="!affectations.length" class="mt-4 text-sm text-muted">
      Aucun élément de paie affecté à cet agent.
    </p>
    <ul v-else class="mt-4 space-y-3">
      <li
        v-for="a in affectations"
        :key="a.id"
        class="flex items-start justify-between gap-3 border-b border-default pb-3 last:border-0 last:pb-0"
      >
        <div class="min-w-0">
          <p class="text-sm text-highlighted">
            {{ a.element?.libelle ?? `Élément #${a.paie_element_id}` }}
            <UBadge v-if="a.active" color="success" variant="outline" size="sm" class="ml-1">En cours</UBadge>
          </p>
          <p class="text-xs text-muted">
            {{ formatPeriode(a.date_debut, a.date_fin) }}
            <span v-if="a.montant != null"> · {{ formatMontant(a.montant) }}</span>
            <span v-else-if="a.taux != null"> · {{ a.taux }} %</span>
            <span v-if="a.quantite != null"> · {{ a.quantite }} unité(s)</span>
          </p>
        </div>
        <UButton
          v-if="peutGerer"
          size="xs"
          color="neutral"
          variant="ghost"
          icon="i-lucide-trash-2"
          :loading="busy"
          @click="retirer(a)"
        />
      </li>
    </ul>

    <UModal v-model:open="open" title="Affecter un élément de paie">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Élément" name="paie_element_id" required>
            <USelectMenu v-model="elementId" :items="elementOptions" value-key="value" class="w-full" />
          </UFormField>
          <UFormField
            v-if="montantAttendu"
            label="Montant"
            name="montant"
            required
            help="Cet élément n'a pas de montant par défaut : il doit être saisi ici."
          >
            <UInputNumber v-model="montant" :min="0" class="w-full" />
          </UFormField>
          <UFormField
            v-if="quantiteAttendue"
            label="Quantité"
            name="quantite"
            required
            help="Nombre de jours ou d'unités du barème."
          >
            <UInputNumber v-model="quantite" :min="0" class="w-full" />
          </UFormField>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Du" name="date_debut" required>
              <UInput v-model="dateDebut" type="date" class="w-full" />
            </UFormField>
            <UFormField label="Au" name="date_fin">
              <UInput v-model="dateFin" type="date" class="w-full" />
            </UFormField>
          </div>
          <UFormField label="Motif" name="motif" help="Obligatoire pour une prime exceptionnelle.">
            <UTextarea v-model="motif" :rows="3" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
            <UButton :loading="busy" @click="affecter">Affecter</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
