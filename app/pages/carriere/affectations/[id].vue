<script setup lang="ts">
import { structurableLabel, agentNom } from "~/constants/carriere";

/**
 * Détail d'une affectation : identité, circuit de validation (approuver /
 * rejeter par niveau) et action principale selon le statut. L'affectation naît
 * `en_attente_validation` ; une fois le circuit terminé (`approuvee`), elle
 * peut être activée ; active, elle peut être terminée.
 */
const route = useRoute();
const id = computed(() => Number(route.params.id));

const affectationsApi = useAffectationsApi();
const toast = useToast();
const handleError = useApiError();

const { data, pending, error, refresh } = useAsyncData(
  () => `affectation-${id.value}`,
  () => (id.value > 0 ? affectationsApi.getById(id.value) : Promise.resolve(null)),
  { watch: [id] },
);
const affectation = computed(() => data.value?.data ?? null);
const statut = computed(() => affectation.value?.statut ?? "");

const busy = ref(false);
async function action(fn: () => Promise<unknown>, ok: string) {
  busy.value = true;
  try {
    await fn();
    toast.add({ title: ok, color: "success" });
    await refresh();
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}
const activer = () => action(() => affectationsApi.activer(id.value), "Affectation activée");
const terminer = () => action(() => affectationsApi.terminer(id.value), "Affectation terminée");
const rejeter = () => action(() => affectationsApi.rejeter(id.value), "Affectation rejetée");

const peutRejeter = computed(() => ["en_attente_validation", "approuvee"].includes(statut.value));

async function telechargerNote() {
  busy.value = true;
  try {
    downloadBlob(await affectationsApi.noteService(id.value), `note-service-affectation-${id.value}.pdf`);
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <BasePanel title="Affectation" subtitle="Rattachement d'un agent à une structure">
    <template #actions>
      <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" to="/carriere/affectations">
        Retour
      </UButton>
    </template>

    <BaseDataState :pending="pending" :error="error" :empty="!affectation" empty-label="Affectation introuvable">
      <div v-if="affectation" class="space-y-6">
        <!-- En-tête -->
        <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-default bg-default p-5">
          <div class="min-w-0">
            <p class="text-lg font-semibold text-highlighted">{{ agentNom(affectation.agent) }}</p>
            <p class="text-sm text-muted">
              {{ structurableLabel(affectation.structurable_type) }}
              <span v-if="affectation.date_affectation"> · dès le {{ formatDateLong(affectation.date_affectation) }}</span>
            </p>
          </div>
          <div class="flex items-center gap-2">
            <CarriereStatutBadge :statut="affectation.statut" :label="affectation.statut_label" />
            <UButton
              v-if="statut === 'approuvee'"
              icon="i-lucide-play"
              :loading="busy"
              @click="activer"
            >
              Activer
            </UButton>
            <UButton
              v-else-if="statut === 'active'"
              icon="i-lucide-flag"
              color="neutral"
              variant="soft"
              :loading="busy"
              @click="terminer"
            >
              Terminer
            </UButton>
            <UButton
              v-if="peutRejeter"
              icon="i-lucide-x"
              color="error"
              variant="soft"
              :loading="busy"
              @click="rejeter"
            >
              Rejeter
            </UButton>
            <UButton
              v-if="affectation.note_service"
              icon="i-lucide-file-down"
              color="neutral"
              variant="ghost"
              :loading="busy"
              @click="telechargerNote"
            >
              Note de service
            </UButton>
          </div>
        </div>

        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <!-- Détails -->
          <div class="rounded-xl border border-default bg-default p-5">
            <BaseCardTitle icon="i-lucide-building-2" title="Détails" />
            <dl class="mt-4 grid gap-x-10 gap-y-4 sm:grid-cols-2">
              <BaseDefItem label="Agent" :value="agentNom(affectation.agent)" />
              <BaseDefItem label="Structure" :value="structurableLabel(affectation.structurable_type)" />
              <BaseDefItem label="Supérieur hiérarchique" :value="affectation.superieur_hierarchique?.nom_complet" />
              <BaseDefItem label="Date d'affectation" :value="formatDateLong(affectation.date_affectation)" />
              <BaseDefItem label="Date de fin" :value="formatDateLong(affectation.date_fin)" />
              <BaseDefItem label="Motif" :value="affectation.motif" />
            </dl>
          </div>

          <!-- Circuit -->
          <div class="rounded-xl border border-default bg-default p-5">
            <BaseCardTitle icon="i-lucide-git-merge" title="Circuit de validation" />
            <div class="mt-4">
              <CarriereCircuit :validations="affectation.validations ?? []" @changed="refresh" />
            </div>
          </div>
        </div>
      </div>
    </BaseDataState>
  </BasePanel>
</template>
