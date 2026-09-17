<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { PaieLotLigne } from "~/schemas/paie-lot";
import {
  actionsLot,
  agentNom,
  formatMontant,
  SOURCE_DETAIL_LABEL,
  validationBloquee,
  type ActionLotPaie,
  type SourceDetailPaie,
} from "~/constants/paie";

/**
 * Lot mensuel de paie : pilotage du cycle, lignes par agent, bulletins et
 * export de la masse.
 *
 * Les boutons viennent de `data.actions` — c'est le serveur qui dit ce que le
 * statut autorise. La validation reste refusée (422) tant qu'une anomalie
 * bloquante subsiste : on l'annonce avant le clic.
 */
const route = useRoute();
const id = computed(() => Number(route.params.id));

const api = usePaieApi();
const auth = useAuthStore();
const toast = useToast();
const handleError = useApiError();

const peutGerer = computed(() => auth.can("gerer-salaires"));

const { data, pending, error, refresh } = useAsyncData(
  () => `paie-lot-${id.value}`,
  () => (id.value > 0 ? api.lot(id.value) : Promise.resolve(null)),
  { watch: [id] },
);
const lot = computed(() => data.value?.data ?? null);

const filtreLignes = reactive<Record<string, string | number | undefined>>({});
const { data: lignesData, refresh: refreshLignes } = useAsyncData(
  () => `paie-lot-lignes-${id.value}`,
  () => (id.value > 0 ? api.lignes(id.value, { ...filtreLignes }) : Promise.resolve(null)),
  { watch: [id, filtreLignes] },
);
const lignes = computed(() => lignesData.value?.data ?? []);

const actions = computed(() => (lot.value ? actionsLot(lot.value) : []));
const bloquee = computed(() => !!lot.value && validationBloquee(lot.value));
const exportable = computed(() => lot.value?.actions?.exporter === true);

const horsGrilleSeulement = ref(false);
watch(horsGrilleSeulement, (v) => (v ? (filtreLignes.hors_grille = 1) : delete filtreLignes.hors_grille));

const busy = ref(false);

async function executer(fn: () => Promise<unknown>, message: string) {
  busy.value = true;
  try {
    await fn();
    toast.add({ title: message, color: "success" });
    await Promise.all([refresh(), refreshLignes()]);
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

function lancer(action: ActionLotPaie) {
  if (!lot.value) return;
  const lotId = lot.value.id;
  switch (action.key) {
    case "generer":
      return executer(() => api.genererLot(lotId), "Lot généré");
    case "controler":
      return executer(() => api.controlerLot(lotId), "Contrôle effectué");
    case "valider":
      if (bloquee.value) {
        toast.add({ title: "Des anomalies bloquantes empêchent la validation.", color: "error" });
        return;
      }
      return executer(() => api.validerLot(lotId), "Lot validé");
    case "cloturer":
      if (!confirm("Clôturer le lot ? Il ne sera plus modifiable.")) return;
      return executer(() => api.cloturerLot(lotId), "Lot clôturé");
    case "supprimer":
      if (!confirm("Supprimer ce lot de paie ?")) return;
      return executer(() => api.supprimerLot(lotId), "Lot supprimé").then(async () => {
        await navigateTo("/paie/lots");
      });
  }
}

async function exporter(format: "csv" | "pdf") {
  busy.value = true;
  try {
    const blob = await api.exporterLot(id.value, format);
    downloadBlob(blob, `masse-salariale-${lot.value?.periode ?? id.value}.${format}`);
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

async function bulletin(ligne: PaieLotLigne) {
  busy.value = true;
  try {
    downloadBlob(
      await api.bulletinLigne(id.value, ligne.id),
      `bulletin-${ligne.agent?.matricule ?? ligne.agent_id}-${lot.value?.periode ?? ""}.pdf`,
    );
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

// — Détail d'une ligne ————————————————————————————————————————
const detailOpen = ref(false);
const ligneCourante = ref<PaieLotLigne | null>(null);

async function ouvrirDetail(ligne: PaieLotLigne) {
  ligneCourante.value = ligne;
  detailOpen.value = true;
  try {
    const { data: complete } = await api.ligne(id.value, ligne.id);
    ligneCourante.value = complete;
  } catch (err) {
    handleError(err);
  }
}

const gains = computed(() => (ligneCourante.value?.details ?? []).filter((d) => d.sens === "gain"));
const retenues = computed(() => (ligneCourante.value?.details ?? []).filter((d) => d.sens === "retenue"));

const columns: TableColumn<PaieLotLigne>[] = [
  {
    id: "agent",
    header: "Agent",
    accessorFn: (l) => agentNom(l.agent),
    cell: ({ row }) => agentNom(row.original.agent),
  },
  { id: "base", header: "Base" },
  { id: "gains", header: "Gains" },
  { id: "retenues", header: "Retenues" },
  { id: "net", header: "Net à payer" },
  { id: "actions", header: "" },
];
</script>

<template>
  <BasePanel title="Lot de paie" subtitle="Génération, contrôle, validation et export">
    <template #actions>
      <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" to="/paie/lots">Retour</UButton>
    </template>

    <BaseDataState :pending="pending" :error="error" :empty="!lot" empty-label="Lot introuvable">
      <div v-if="lot" class="space-y-6">
        <!-- En-tête -->
        <div class="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-default bg-default p-5">
          <div class="min-w-0">
            <p class="text-lg font-semibold text-highlighted">{{ lot.periode_label ?? lot.periode }}</p>
            <p class="text-sm text-muted">
              {{ lot.nb_lignes ?? 0 }} agent(s) · {{ formatMontant(lot.total_net) }} net
            </p>
            <div class="mt-2">
              <PaieStatutLotBadge :statut="lot.statut" :label="lot.statut_label" />
            </div>
          </div>

          <div v-if="peutGerer || exportable" class="flex flex-wrap items-center justify-end gap-2">
            <UButton
              v-for="action in actions"
              :key="action.key"
              :icon="action.icon"
              :color="action.color"
              :variant="action.principale ? 'solid' : 'soft'"
              :disabled="!peutGerer"
              :loading="busy"
              @click="lancer(action)"
            >
              {{ action.label }}
            </UButton>
            <UButton
              v-if="exportable"
              icon="i-lucide-file-spreadsheet"
              color="neutral"
              variant="soft"
              :loading="busy"
              @click="exporter('csv')"
            >
              Export CSV
            </UButton>
            <UButton
              v-if="exportable"
              icon="i-lucide-file-down"
              color="neutral"
              variant="soft"
              :loading="busy"
              @click="exporter('pdf')"
            >
              Export PDF
            </UButton>
          </div>
        </div>

        <!-- Totaux -->
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <BaseStatCard label="Agents payés" :value="lot.nb_lignes ?? 0" icon="i-lucide-users" />
          <BaseStatCard label="Total des gains" :value="formatMontant(lot.total_gains)" icon="i-lucide-trending-up" />
          <BaseStatCard label="Total des retenues" :value="formatMontant(lot.total_retenues)" icon="i-lucide-trending-down" />
          <BaseStatCard label="Masse nette" :value="formatMontant(lot.total_net)" icon="i-lucide-banknote" />
        </div>

        <!-- Anomalies -->
        <UAlert
          v-if="lot.anomalies?.length"
          :color="bloquee ? 'error' : 'warning'"
          variant="subtle"
          icon="i-lucide-alert-triangle"
          :title="
            bloquee
              ? `${lot.nb_anomalies_bloquantes} anomalie(s) bloquante(s) : validation impossible`
              : `${lot.nb_anomalies} anomalie(s) signalée(s)`
          "
        >
          <template #description>
            <ul class="mt-2 space-y-1">
              <li v-for="(a, i) in lot.anomalies.slice(0, 10)" :key="i" class="text-sm">
                <span class="font-medium">{{ a.code }}</span>
                <span v-if="a.message"> — {{ a.message }}</span>
              </li>
            </ul>
            <p v-if="lot.anomalies.length > 10" class="mt-1 text-xs">
              et {{ lot.anomalies.length - 10 }} autre(s)…
            </p>
          </template>
        </UAlert>

        <!-- Lignes -->
        <div class="rounded-xl border border-default bg-default p-5">
          <BaseCardTitle icon="i-lucide-receipt" title="Lignes de paie" />
          <div class="mt-4">
            <BaseTable
              :data="lignes"
              :columns="columns"
              :bordered="false"
              searchable
              search-placeholder="Rechercher un agent…"
              :page-size="15"
            >
              <template #filters>
                <USwitch v-model="horsGrilleSeulement" label="Hors grille seulement" />
              </template>
              <template #empty>
                <p class="py-6 text-center text-sm text-muted">
                  Aucune ligne : générez le lot pour calculer la paie du mois.
                </p>
              </template>
              <template #base-cell="{ row }">
                <span v-if="row!.original.hors_grille" class="text-sm text-muted">
                  Salaire fonctionnel
                </span>
                <span v-else class="text-sm">{{ formatMontant(row!.original.montant_base) }}</span>
              </template>
              <template #gains-cell="{ row }">
                <span class="text-sm">{{ formatMontant(row!.original.total_gains) }}</span>
              </template>
              <template #retenues-cell="{ row }">
                <span class="text-sm">{{ formatMontant(row!.original.total_retenues) }}</span>
              </template>
              <template #net-cell="{ row }">
                <span class="text-sm font-semibold text-highlighted">
                  {{ formatMontant(row!.original.montant_net) }}
                </span>
              </template>
              <template #actions-cell="{ row }">
                <div class="flex justify-end gap-1">
                  <UButton
                    size="xs"
                    color="neutral"
                    variant="ghost"
                    icon="i-lucide-eye"
                    @click="ouvrirDetail(row!.original)"
                  />
                  <UButton
                    size="xs"
                    color="neutral"
                    variant="ghost"
                    icon="i-lucide-file-down"
                    :loading="busy"
                    @click="bulletin(row!.original)"
                  />
                </div>
              </template>
            </BaseTable>
          </div>
        </div>
      </div>
    </BaseDataState>

    <!-- Détail d'une ligne : gains / retenues / net -->
    <UModal v-model:open="detailOpen">
      <template #title>
        <BaseCardTitle icon="i-lucide-receipt" :title="`Bulletin — ${agentNom(ligneCourante?.agent)}`" />
      </template>
      <template #body>
        <div v-if="ligneCourante" class="space-y-5">
          <div>
            <p class="text-sm font-medium text-highlighted">Gains</p>
            <ul class="mt-2 space-y-2">
              <li v-for="(d, i) in gains" :key="i" class="flex items-center justify-between gap-3 text-sm">
                <span class="min-w-0 truncate">
                  {{ d.libelle ?? d.code }}
                  <span v-if="d.source" class="text-xs text-muted">
                    · {{ d.source_label ?? SOURCE_DETAIL_LABEL[d.source as SourceDetailPaie] }}
                  </span>
                </span>
                <span class="shrink-0 font-medium">{{ formatMontant(d.montant) }}</span>
              </li>
            </ul>
            <p v-if="!gains.length" class="mt-2 text-sm text-muted">Aucun gain détaillé.</p>
          </div>

          <div>
            <p class="text-sm font-medium text-highlighted">Retenues</p>
            <ul class="mt-2 space-y-2">
              <li v-for="(d, i) in retenues" :key="i" class="flex items-center justify-between gap-3 text-sm">
                <span class="min-w-0 truncate">{{ d.libelle ?? d.code }}</span>
                <span class="shrink-0 font-medium">− {{ formatMontant(d.montant) }}</span>
              </li>
            </ul>
            <p v-if="!retenues.length" class="mt-2 text-sm text-muted">Aucune retenue.</p>
          </div>

          <div class="flex items-center justify-between border-t border-default pt-4">
            <span class="text-sm font-medium text-highlighted">Net à payer</span>
            <span class="text-lg font-bold text-highlighted">{{ formatMontant(ligneCourante.montant_net) }}</span>
          </div>

          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="detailOpen = false">Fermer</UButton>
            <UButton icon="i-lucide-file-down" :loading="busy" @click="bulletin(ligneCourante)">
              Bulletin PDF
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </BasePanel>
</template>
