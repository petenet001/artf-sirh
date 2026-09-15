<script setup lang="ts">
import { agentNom, estCongeAccorde, peutAnnulerConge } from "~/constants/conges";

/**
 * Détail d'une demande de congé : identité, période, justificatif
 * (téléchargeable), circuit de validation (valider / rejeter selon l'étape),
 * retrait par le demandeur tant qu'elle est `soumise`, et PDF (fiche toujours ;
 * attestation une fois le circuit du type terminé et accordé).
 */
const route = useRoute();
const id = computed(() => Number(route.params.id));

const api = useDemandesCongeApi();
const auth = useAuthStore();
const toast = useToast();
const handleError = useApiError();

const { data, pending, error, refresh } = useAsyncData(
  () => `demande-conge-${id.value}`,
  () => (id.value > 0 ? api.getById(id.value) : Promise.resolve(null)),
  { watch: [id] },
);
const demande = computed(() => data.value?.data ?? null);

// Attestation : circuit du type terminé et accordé (y compris N+1 seul).
const attestationDispo = computed(() => !!demande.value && estCongeAccorde(demande.value));

const annulable = computed(
  () =>
    !!demande.value &&
    peutAnnulerConge(demande.value, { agent_id: auth.user?.agent_id, estAdmin: auth.hasRole("admin") }),
);

const busy = ref(false);
async function telecharger(kind: "fiche" | "attestation") {
  busy.value = true;
  try {
    const blob = kind === "fiche" ? await api.fichePdf(id.value) : await api.attestation(id.value);
    downloadBlob(blob, `${kind}-conge-${id.value}.pdf`);
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

async function telechargerJustificatif() {
  const nom = demande.value?.justificatif?.nom;
  if (!nom) return;
  busy.value = true;
  try {
    downloadBlob(await api.justificatif(id.value), nom);
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

async function annuler() {
  if (!confirm("Retirer cette demande de congé ? Elle ne pourra plus être validée.")) return;
  busy.value = true;
  try {
    await api.annuler(id.value);
    toast.add({ title: "Demande retirée", color: "success" });
    await refresh();
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <BasePanel title="Demande de congé" subtitle="Détail et circuit de validation">
    <template #actions>
      <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" to="/conges/demandes">Retour</UButton>
    </template>

    <BaseDataState :pending="pending" :error="error" :empty="!demande" empty-label="Demande introuvable">
      <div v-if="demande" class="space-y-6">
        <!-- En-tête -->
        <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-default bg-default p-5">
          <div class="min-w-0">
            <p class="text-lg font-semibold text-highlighted">{{ agentNom(demande.agent) }}</p>
            <p class="text-sm text-muted">
              {{ demande.type_conge?.nom }}
              <span> · {{ formatPeriode(demande.date_debut, demande.date_fin) }}</span>
              <span v-if="demande.nb_jours != null"> · {{ demande.nb_jours }} jour(s)</span>
            </p>
          </div>
          <div class="flex items-center gap-2">
            <CongesDemandeStatutBadge :statut="demande.statut" :label="demande.statut_label" />
            <UButton v-if="annulable" icon="i-lucide-undo-2" color="error" variant="soft" :loading="busy" @click="annuler">
              Retirer
            </UButton>
            <UButton icon="i-lucide-file-down" color="neutral" variant="soft" :loading="busy" @click="telecharger('fiche')">
              Fiche
            </UButton>
            <UButton v-if="attestationDispo" icon="i-lucide-award" :loading="busy" @click="telecharger('attestation')">
              Attestation
            </UButton>
          </div>
        </div>

        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <!-- Détails -->
          <div class="rounded-xl border border-default bg-default p-5">
            <BaseCardTitle icon="i-lucide-calendar" title="Détails" />
            <dl class="mt-4 grid gap-x-10 gap-y-4 sm:grid-cols-2">
              <BaseDefItem label="Agent" :value="agentNom(demande.agent)" />
              <BaseDefItem label="Type de congé" :value="demande.type_conge?.nom" />
              <BaseDefItem label="Début" :value="formatDateLong(demande.date_debut)" />
              <BaseDefItem label="Fin" :value="formatDateLong(demande.date_fin)" />
              <BaseDefItem label="Nombre de jours" :value="demande.nb_jours != null ? String(demande.nb_jours) : null" />
              <BaseDefItem label="Justificatif">
                <UButton
                  v-if="demande.justificatif"
                  variant="link"
                  icon="i-lucide-paperclip"
                  class="p-0"
                  :loading="busy"
                  @click="telechargerJustificatif"
                >
                  {{ demande.justificatif.nom }}
                </UButton>
                <template v-else>—</template>
              </BaseDefItem>
              <BaseDefItem label="Motif" :value="demande.motif" class="sm:col-span-2" />
            </dl>
          </div>

          <!-- Circuit -->
          <div class="rounded-xl border border-default bg-default p-5">
            <BaseCardTitle icon="i-lucide-git-merge" title="Circuit de validation" />
            <div class="mt-4">
              <CongesCircuit :demande="demande" @changed="refresh" />
            </div>
          </div>
        </div>
      </div>
    </BaseDataState>
  </BasePanel>
</template>
