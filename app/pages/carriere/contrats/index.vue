<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Contrat } from "~/schemas/contrat";
import { agentNom, essaiOuvert } from "~/constants/positions";

/**
 * Contrats et périodes d'essai (CCN art. 49) + file du délai de 30 jours
 * ouvrables (art. 52).
 *
 * À la création d'un CDI/CDD, l'API paie l'**échelon 1** de la classe : c'est
 * la confirmation de l'essai qui rétablit l'échelon prévu. La rupture pendant
 * l'essai se fait sans préavis ni indemnité.
 */
const api = useContratsApi();
const auth = useAuthStore();
const toast = useToast();
const handleError = useApiError();

const peutModifier = computed(() => auth.can("modifier-contrats"));

const { data, pending, error, refresh } = useAsyncData("contrats", () => api.list());
const contrats = computed(() => data.value?.data ?? []);

const { data: alertesData, refresh: refreshAlertes } = useAsyncData("contrats-alertes-delai", () =>
  auth.can("consulter-contrats") ? api.alertesDelai() : Promise.resolve(null),
);
const alertes = computed(() => alertesData.value?.data ?? []);

const busy = ref(false);
const ruptureOpen = ref(false);
const courant = ref<Contrat | null>(null);
const commentaire = ref("");

async function executer(fn: () => Promise<unknown>, message: string) {
  busy.value = true;
  try {
    await fn();
    toast.add({ title: message, color: "success" });
    ruptureOpen.value = false;
    await Promise.all([refresh(), refreshAlertes()]);
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

function confirmer(contrat: Contrat) {
  executer(() => api.confirmerEssai(contrat.id), "Essai confirmé — salaire porté à l'échelon prévu");
}

function renouveler(contrat: Contrat) {
  executer(() => api.renouvelerEssai(contrat.id), "Essai renouvelé");
}

function ouvrirRupture(contrat: Contrat) {
  courant.value = contrat;
  commentaire.value = "";
  ruptureOpen.value = true;
}

function rompre() {
  if (!courant.value) return;
  executer(
    () => api.rompreEssai(courant.value!.id, { commentaire: commentaire.value.trim() || null }),
    "Essai rompu",
  );
}

const columns: TableColumn<Contrat>[] = [
  {
    id: "agent",
    header: "Agent",
    accessorFn: (c) => agentNom(c.agent),
    cell: ({ row }) => agentNom(row.original.agent),
  },
  { id: "type", header: "Type" },
  { id: "periode", header: "Période" },
  { id: "essai", header: "Période d'essai" },
  { id: "actions", header: "" },
];
</script>

<template>
  <BasePanel title="Contrats" subtitle="Périodes d'essai et délai de régularisation (art. 49 et 52)">
    <div class="space-y-6">
      <UAlert
        v-if="alertes.length"
        color="warning"
        variant="subtle"
        icon="i-lucide-alarm-clock"
        :title="`${alertes.length} agent(s) en service sans contrat depuis plus de 30 jours ouvrables`"
      >
        <template #description>
          <ul class="mt-2 space-y-1">
            <li v-for="a in alertes.slice(0, 8)" :key="a.dossier_id" class="text-sm">
              {{ agentNom(a.agent) }}
              <span class="text-muted">
                — service pris le {{ formatDate(a.date_prise_service) }} ({{ a.jours_ouvrables }} jours ouvrables)
              </span>
              <NuxtLink :to="`/integration/dossiers/${a.dossier_id}`" class="ml-1 text-primary hover:underline">
                dossier
              </NuxtLink>
            </li>
          </ul>
          <p v-if="alertes.length > 8" class="mt-1 text-xs text-muted">
            et {{ alertes.length - 8 }} autre(s)…
          </p>
        </template>
      </UAlert>

      <BaseDataState :pending="pending" :error="error">
        <BaseTable
          :data="contrats"
          :columns="columns"
          searchable
          search-placeholder="Rechercher un agent…"
          :page-size="10"
        >
          <template #empty>
            <p class="py-6 text-center text-sm text-muted">Aucun contrat</p>
          </template>
          <template #type-cell="{ row }">
            <span class="text-sm">{{ row!.original.type_contrat?.nom ?? "—" }}</span>
          </template>
          <template #periode-cell="{ row }">
            <span class="text-sm text-muted">
              {{ formatPeriode(row!.original.date_debut, row!.original.date_fin) }}
            </span>
          </template>
          <template #essai-cell="{ row }">
            <PositionsEssaiBadge :essai="row!.original.essai" />
          </template>
          <template #actions-cell="{ row }">
            <div v-if="peutModifier && essaiOuvert(row!.original.essai)" class="flex justify-end gap-2">
              <UButton
                size="xs"
                color="success"
                variant="soft"
                icon="i-lucide-check"
                :loading="busy"
                @click="confirmer(row!.original)"
              >
                Confirmer
              </UButton>
              <UButton
                v-if="row!.original.essai?.peut_renouveler"
                size="xs"
                color="neutral"
                variant="soft"
                icon="i-lucide-repeat"
                :loading="busy"
                @click="renouveler(row!.original)"
              >
                Renouveler
              </UButton>
              <UButton
                size="xs"
                color="error"
                variant="soft"
                icon="i-lucide-x"
                :loading="busy"
                @click="ouvrirRupture(row!.original)"
              >
                Rompre
              </UButton>
            </div>
          </template>
        </BaseTable>
      </BaseDataState>
    </div>

    <UModal v-model:open="ruptureOpen" title="Rompre la période d'essai">
      <template #body>
        <div class="space-y-4">
          <p class="text-sm text-muted">
            La rupture pendant l'essai se fait sans préavis ni indemnité (art. 49).
          </p>
          <UFormField label="Commentaire" name="commentaire">
            <UTextarea v-model="commentaire" :rows="3" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="ruptureOpen = false">Annuler</UButton>
            <UButton color="error" :loading="busy" @click="rompre">Rompre l'essai</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </BasePanel>
</template>
