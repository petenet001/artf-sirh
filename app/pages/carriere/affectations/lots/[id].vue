<script setup lang="ts">
import { structurableLabel, agentNom } from "~/constants/carriere";

/**
 * Détail d'un lot d'affectations : un seul circuit et un seul acte pour
 * plusieurs agents. On active / rejette le lot entier (jamais une ligne isolée).
 */
const route = useRoute();
const id = computed(() => Number(route.params.id));

const affectationsApi = useAffectationsApi();
const toast = useToast();
const handleError = useApiError();

const { data, pending, error, refresh } = useAsyncData(
  () => `lot-affectation-${id.value}`,
  () => (id.value > 0 ? affectationsApi.lot(id.value) : Promise.resolve(null)),
  { watch: [id] },
);
const lot = computed(() => data.value?.data ?? null);
const statut = computed(() => lot.value?.statut ?? "");

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
const activer = () => action(() => affectationsApi.activerLot(id.value), "Lot activé — toutes les affectations sont actives");
const rejeter = () => action(() => affectationsApi.rejeterLot(id.value), "Lot rejeté");

async function telechargerActe() {
  busy.value = true;
  try {
    downloadBlob(await affectationsApi.acteLot(id.value), `acte-lot-affectation-${id.value}.pdf`);
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

const peutRejeter = computed(() => ["en_attente_validation", "approuvee"].includes(statut.value));
</script>

<template>
  <BasePanel title="Lot d'affectations" subtitle="Un circuit, un acte, plusieurs agents">
    <template #actions>
      <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" to="/carriere/affectations">
        Retour
      </UButton>
    </template>

    <BaseDataState :pending="pending" :error="error" :empty="!lot" empty-label="Lot introuvable">
      <div v-if="lot" class="space-y-6">
        <!-- En-tête -->
        <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-default bg-default p-5">
          <div class="min-w-0">
            <p class="text-lg font-semibold text-highlighted">Lot #{{ lot.id }} · {{ lot.total ?? lot.affectations?.length ?? 0 }} agent(s)</p>
            <p class="text-sm text-muted">
              <span v-if="lot.date_affectation">Dès le {{ formatDateLong(lot.date_affectation) }}</span>
              <span v-if="lot.motif"> · {{ lot.motif }}</span>
            </p>
          </div>
          <div class="flex items-center gap-2">
            <CarriereStatutBadge :statut="lot.statut" :label="lot.statut_label" />
            <UButton v-if="statut === 'approuvee'" icon="i-lucide-play" :loading="busy" @click="activer">Activer le lot</UButton>
            <UButton v-if="peutRejeter" icon="i-lucide-x" color="error" variant="soft" :loading="busy" @click="rejeter">Rejeter</UButton>
            <UButton icon="i-lucide-file-down" color="neutral" variant="ghost" :loading="busy" @click="telechargerActe">Acte PDF</UButton>
          </div>
        </div>

        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <!-- Affectations du lot -->
          <div class="rounded-xl border border-default bg-default p-5">
            <BaseCardTitle icon="i-lucide-users" title="Affectations du lot" />
            <div class="mt-4 space-y-2">
              <div
                v-for="a in lot.affectations ?? []"
                :key="a.id"
                class="flex items-center gap-3 rounded-lg border border-default p-3"
              >
                <UIcon name="i-lucide-map-pin" class="size-4 shrink-0 text-muted" />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-highlighted">{{ agentNom(a.agent) }}</p>
                  <p class="truncate text-xs text-muted">{{ structurableLabel(a.structurable_type) }}</p>
                </div>
                <CarriereStatutBadge :statut="a.statut" :label="a.statut_label" />
              </div>
            </div>
          </div>

          <!-- Circuit -->
          <div class="rounded-xl border border-default bg-default p-5">
            <BaseCardTitle icon="i-lucide-git-merge" title="Circuit de validation" />
            <div class="mt-4">
              <CarriereCircuit :validations="lot.validations ?? []" @changed="refresh" />
            </div>
          </div>
        </div>
      </div>
    </BaseDataState>
  </BasePanel>
</template>
