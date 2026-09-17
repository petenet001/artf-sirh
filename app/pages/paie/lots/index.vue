<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { PaieLot } from "~/schemas/paie-lot";
import { STATUTS_PAIE_LOT } from "~/constants/enums";
import { formatMontant, STATUT_PAIE_LOT_LABEL } from "~/constants/paie";

/**
 * Lots mensuels de paie. Une période = un lot ; le cycle va du brouillon à la
 * clôture, la génération pouvant être rejouée tant que le lot n'est pas validé.
 */
const api = usePaieApi();
const auth = useAuthStore();
const toast = useToast();
const handleError = useApiError();

const peutGerer = computed(() => auth.can("gerer-salaires"));

const filters = reactive<Record<string, string | number | undefined>>({});
const { data, pending, error } = useAsyncData(
  "paie-lots",
  () => api.lots({ ...filters }),
  { watch: [filters] },
);
const lots = computed(() => data.value?.data ?? []);

const ALL = "__all__";
const statutItems = [
  { label: "Tous les statuts", value: ALL },
  ...STATUTS_PAIE_LOT.map((s) => ({ label: STATUT_PAIE_LOT_LABEL[s], value: s })),
];
const statut = ref<string>(ALL);
watch(statut, (v) => (v === ALL ? delete filters.statut : (filters.statut = v)));

// — Ouverture d'une période ————————————————————————————————————
const open = ref(false);
const busy = ref(false);
const maintenant = new Date();
const annee = ref(maintenant.getFullYear());
const mois = ref(maintenant.getMonth() + 1);
const commentaire = ref("");

const moisOptions = Array.from({ length: 12 }, (_, i) => ({
  label: new Date(2000, i, 1).toLocaleDateString("fr-FR", { month: "long" }),
  value: i + 1,
}));

async function creer() {
  busy.value = true;
  try {
    const { data: lot } = await api.creerLot({
      annee: annee.value,
      mois: mois.value,
      commentaire: commentaire.value.trim() || null,
    });
    toast.add({ title: "Lot de paie ouvert", color: "success" });
    open.value = false;
    await navigateTo(`/paie/lots/${lot.id}`);
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

const columns: TableColumn<PaieLot>[] = [
  {
    id: "periode",
    header: "Période",
    accessorFn: (l) => l.periode_label ?? l.periode ?? "",
    cell: ({ row }) => row.original.periode_label ?? row.original.periode ?? "—",
  },
  { id: "lignes", header: "Agents" },
  { id: "net", header: "Masse nette" },
  { id: "anomalies", header: "Anomalies" },
  { id: "statut", header: "Statut" },
];
</script>

<template>
  <BasePanel title="Lots de paie" subtitle="Calcul mensuel de la masse salariale">
    <BaseDataState :pending="pending" :error="error">
      <BaseTable
        :data="lots"
        :columns="columns"
        :page-size="12"
        :row-to="(l) => `/paie/lots/${l.id}`"
      >
        <template #filters>
          <USelect v-model="statut" :items="statutItems" class="w-44" />
        </template>
        <template #actions>
          <UButton v-if="peutGerer" icon="i-lucide-plus" @click="open = true">Ouvrir une période</UButton>
        </template>
        <template #empty>
          <p class="py-6 text-center text-sm text-muted">Aucun lot de paie</p>
        </template>
        <template #lignes-cell="{ row }">
          <span class="text-sm">{{ row!.original.nb_lignes ?? 0 }}</span>
        </template>
        <template #net-cell="{ row }">
          <span class="text-sm font-medium text-highlighted">{{ formatMontant(row!.original.total_net) }}</span>
        </template>
        <template #anomalies-cell="{ row }">
          <div class="flex items-center gap-2">
            <UBadge v-if="row!.original.nb_anomalies_bloquantes" color="error" variant="subtle" size="sm">
              {{ row!.original.nb_anomalies_bloquantes }} bloquante(s)
            </UBadge>
            <span v-else-if="row!.original.nb_anomalies" class="text-sm text-muted">
              {{ row!.original.nb_anomalies }} info
            </span>
            <span v-else class="text-sm text-muted">—</span>
          </div>
        </template>
        <template #statut-cell="{ row }">
          <PaieStatutLotBadge :statut="row!.original.statut" :label="row!.original.statut_label" />
        </template>
      </BaseTable>
    </BaseDataState>

    <UModal v-model:open="open" title="Ouvrir une période de paie">
      <template #body>
        <div class="space-y-4">
          <p class="text-sm text-muted">Une seule période par mois : l'API refuse un doublon.</p>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Mois" name="mois" required>
              <USelect v-model="mois" :items="moisOptions" value-key="value" class="w-full" />
            </UFormField>
            <UFormField label="Année" name="annee" required>
              <UInputNumber v-model="annee" :min="2000" :max="2100" class="w-full" />
            </UFormField>
          </div>
          <UFormField label="Commentaire" name="commentaire">
            <UTextarea v-model="commentaire" :rows="3" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
            <UButton :loading="busy" @click="creer">Ouvrir</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </BasePanel>
</template>
