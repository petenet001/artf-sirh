<script setup lang="ts">
import type { FormSubmitEvent, TableColumn } from "@nuxt/ui";
import {
  campagneCongeAnnuelInputSchema,
  type CampagneCongeAnnuel,
  type CampagneCongeAnnuelInput,
} from "~/schemas/conge-annuel";
import type { AgentSummary } from "~/schemas/agent-summary";
import { agentNom } from "~/constants/conges";
import { STATUT_CAMPAGNE_COLOR, STATUT_CAMPAGNE_LABEL, gereCongeAnnuel } from "~/constants/conges-annuels";

/**
 * Campagnes de congé annuel : `brouillon` → `ouverte` → `cloturee`.
 *
 * Lecture pour tout porteur de `consulter-conges` ; création, ouverture,
 * clôture et liste « sans proposition » réservées au rôle `rh` ou `admin`
 * (`gereCongeAnnuel`) — un chef reçoit 403 malgré `valider-conges`.
 * Une campagne par année, une seule ouverte à la fois : l'API tranche (422).
 * La clôture fige les propositions et ouvre leur traitement N+1 → RH ; elle
 * ne débite rien.
 */
const auth = useAuthStore();
const api = useCongesAnnuelsApi().campagnes;
const toast = useToast();
const handleError = useApiError();

const gere = computed(() => gereCongeAnnuel(auth.hasRole));

const { campagnes, pending, error, refresh } = useCampagnesCongeAnnuel();

const busy = ref(false);

async function transition(c: CampagneCongeAnnuel, action: "ouvrir" | "cloturer") {
  const question = action === "ouvrir"
    ? `Ouvrir la campagne ${c.annee} ? Les agents pourront proposer leur date de départ.`
    : `Clôturer la campagne ${c.annee} ? Plus aucune proposition ne sera acceptée ; le traitement N+1 puis RH commencera.`;
  if (!confirm(question)) return;
  busy.value = true;
  try {
    await (action === "ouvrir" ? api.ouvrir(c.id) : api.cloturer(c.id));
    toast.add({ title: action === "ouvrir" ? "Campagne ouverte" : "Campagne clôturée", color: "success" });
    await refresh();
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

// — Création ———————————————————————————————————————————————————
const creationOpen = ref(false);
const anneeCourante = new Date().getFullYear();
const state = reactive<Partial<CampagneCongeAnnuelInput>>({});

function ouvrirCreation() {
  // Proposer l'année sans campagne la plus proche.
  const prises = new Set(campagnes.value.map((c) => c.annee));
  const annee = prises.has(anneeCourante) ? anneeCourante + 1 : anneeCourante;
  state.annee = annee;
  state.date_ouverture = undefined;
  state.date_cloture = undefined;
  creationOpen.value = true;
}

async function creer(event: FormSubmitEvent<CampagneCongeAnnuelInput>) {
  busy.value = true;
  try {
    await api.create(event.data);
    toast.add({ title: `Campagne ${event.data.annee} créée (brouillon)`, color: "success" });
    creationOpen.value = false;
    await refresh();
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

// — Agents sans proposition ——————————————————————————————————————
const sansOpen = ref(false);
const sansCampagne = ref<CampagneCongeAnnuel | null>(null);
const sansListe = ref<AgentSummary[]>([]);
const sansPending = ref(false);

async function voirSansProposition(c: CampagneCongeAnnuel) {
  sansCampagne.value = c;
  sansListe.value = [];
  sansOpen.value = true;
  sansPending.value = true;
  try {
    sansListe.value = (await api.sansProposition(c.id)).data;
  } catch (err) {
    handleError(err);
  } finally {
    sansPending.value = false;
  }
}

const sansColumns: TableColumn<AgentSummary>[] = [
  { accessorKey: "matricule", header: "Matricule", cell: ({ row }) => row.original.matricule ?? "—" },
  { id: "nom", header: "Agent", accessorFn: (a) => agentNom(a), cell: ({ row }) => agentNom(row.original) },
];

const columns: TableColumn<CampagneCongeAnnuel>[] = [
  { accessorKey: "annee", header: "Année" },
  { id: "fenetre", header: "Fenêtre prévue", cell: ({ row }) => formatPeriode(row.original.date_ouverture, row.original.date_cloture) },
  { id: "cloture", header: "Clôturée le", cell: ({ row }) => formatDate(row.original.date_cloture_effective) },
  { id: "statut", header: "Statut" },
  { id: "actions", header: "" },
];
</script>

<template>
  <BaseDataState :pending="pending" :error="error">
    <BaseTable :data="campagnes" :columns="columns" empty-label="Aucune campagne programmée">
      <template #actions>
        <UButton v-if="gere" icon="i-lucide-plus" @click="ouvrirCreation">Nouvelle campagne</UButton>
      </template>
      <template #statut-cell="{ row }">
        <UBadge :color="STATUT_CAMPAGNE_COLOR[row!.original.statut]" variant="subtle">
          {{ row!.original.statut_label ?? STATUT_CAMPAGNE_LABEL[row!.original.statut] }}
        </UBadge>
      </template>
      <template #actions-cell="{ row }">
        <div v-if="gere" class="flex justify-end gap-2">
          <UButton
            v-if="row!.original.statut === 'brouillon'"
            size="xs"
            icon="i-lucide-play"
            :loading="busy"
            @click="transition(row!.original, 'ouvrir')"
          >
            Ouvrir
          </UButton>
          <template v-if="row!.original.statut === 'ouverte'">
            <UButton size="xs" color="neutral" variant="soft" icon="i-lucide-user-search" @click="voirSansProposition(row!.original)">
              Sans proposition
            </UButton>
            <UButton size="xs" color="warning" icon="i-lucide-lock" :loading="busy" @click="transition(row!.original, 'cloturer')">
              Clôturer
            </UButton>
          </template>
          <UButton
            v-if="row!.original.statut === 'cloturee'"
            size="xs"
            color="neutral"
            variant="ghost"
            icon="i-lucide-user-search"
            @click="voirSansProposition(row!.original)"
          >
            Sans proposition
          </UButton>
        </div>
      </template>
    </BaseTable>

    <UModal v-model:open="creationOpen">
      <template #title>
        <BaseCardTitle icon="i-lucide-calendar-range" title="Nouvelle campagne de congé annuel" />
      </template>
      <template #body>
        <UForm :schema="campagneCongeAnnuelInputSchema" :state="state" class="space-y-4" @submit="creer">
          <UFormField label="Année" name="annee" help="Une seule campagne par année.">
            <UInputNumber v-model="state.annee" :min="2000" :max="2100" :format-options="{ useGrouping: false }" class="w-full" />
          </UFormField>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Ouverture" name="date_ouverture">
              <UInput v-model="state.date_ouverture" type="date" class="w-full" />
            </UFormField>
            <UFormField label="Clôture prévue" name="date_cloture">
              <UInput v-model="state.date_cloture" type="date" class="w-full" />
            </UFormField>
          </div>
          <p class="text-xs text-muted">
            La campagne est créée en brouillon : il faudra l'ouvrir pour que les agents puissent proposer.
          </p>
          <div class="flex justify-end gap-2 pt-2">
            <UButton color="neutral" variant="ghost" @click="creationOpen = false">Annuler</UButton>
            <UButton type="submit" :loading="busy">Créer</UButton>
          </div>
        </UForm>
      </template>
    </UModal>

    <UModal v-model:open="sansOpen" :ui="{ content: 'sm:max-w-2xl' }">
      <template #title>
        <BaseCardTitle
          icon="i-lucide-user-search"
          :title="`Agents actifs sans proposition — campagne ${sansCampagne?.annee ?? ''}`"
        />
      </template>
      <template #body>
        <BaseDataState :pending="sansPending">
          <BaseTable
            :data="sansListe"
            :columns="sansColumns"
            searchable
            search-placeholder="Rechercher un agent…"
            :page-size="10"
            :bordered="false"
            empty-label="Tous les agents actifs ont déposé une proposition."
          />
        </BaseDataState>
      </template>
    </UModal>
  </BaseDataState>
</template>
