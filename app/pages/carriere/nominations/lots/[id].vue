<script setup lang="ts">
import { structurableLabel, agentNom } from "~/constants/carriere";

/**
 * Détail d'un lot de nominations : un circuit, un acte, plusieurs agents.
 * On active / rejette le lot entier (jamais une ligne isolée).
 */
const route = useRoute();
const id = computed(() => Number(route.params.id));

const nominationsApi = useNominationsApi();
const toast = useToast();
const handleError = useApiError();

const { data, pending, error, refresh } = useAsyncData(
  () => `lot-nomination-${id.value}`,
  () => (id.value > 0 ? nominationsApi.lot(id.value) : Promise.resolve(null)),
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
const activer = () => action(() => nominationsApi.activerLot(id.value), "Lot activé — toutes les nominations sont actives");
const rejeter = () => action(() => nominationsApi.rejeterLot(id.value), "Lot rejeté");

async function telechargerActe() {
  busy.value = true;
  try {
    downloadBlob(await nominationsApi.acteLot(id.value), `acte-lot-nomination-${id.value}.pdf`);
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

const peutRejeter = computed(() => ["en_attente", "approuvee"].includes(statut.value));
</script>

<template>
  <BasePanel title="Lot de nominations" subtitle="Un circuit, un acte, plusieurs agents">
    <template #actions>
      <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" to="/carriere/nominations">
        Retour
      </UButton>
    </template>

    <BaseDataState :pending="pending" :error="error" :empty="!lot" empty-label="Lot introuvable">
      <div v-if="lot" class="space-y-6">
        <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-default bg-default p-5">
          <div class="min-w-0">
            <p class="text-lg font-semibold text-highlighted">Lot #{{ lot.id }} · {{ lot.nominations?.length ?? 0 }} agent(s)</p>
            <p class="text-sm text-muted">
              <span v-if="lot.date_debut">Dès le {{ formatDateLong(lot.date_debut) }}</span>
              <span v-if="lot.type_acte_label"> · {{ lot.type_acte_label }}</span>
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
          <div class="rounded-xl border border-default bg-default p-5">
            <BaseCardTitle icon="i-lucide-users" title="Nominations du lot" />
            <div class="mt-4 space-y-2">
              <div
                v-for="n in lot.nominations ?? []"
                :key="n.id"
                class="flex items-center gap-3 rounded-lg border border-default p-3"
              >
                <UIcon name="i-lucide-award" class="size-4 shrink-0 text-muted" />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-highlighted">{{ agentNom(n.agent) }}</p>
                  <p class="truncate text-xs text-muted">
                    {{ n.poste ?? "—" }} · {{ n.structure?.nom ?? structurableLabel(n.structurable_type) }}
                  </p>
                </div>
                <CarriereStatutBadge :statut="n.statut" :label="n.statut_label" />
              </div>
            </div>
          </div>

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
