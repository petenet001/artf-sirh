<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { DemandeConge } from "~/schemas/demande-conge";
import { STATUT_DEMANDE_LABEL, type EtapeConge } from "~/constants/conges";
import {
  STATUT_CAMPAGNE_COLOR,
  STATUT_CAMPAGNE_LABEL,
  libelleTypeDemande,
  origineDepot,
} from "~/constants/conges-annuels";

/**
 * Mes congés : les demandes du compte connecté et ses soldes.
 *
 * Écran **personnel**, distinct de la liste RH : pas de sélecteur de portée, pas
 * de colonne « Agent », et la demande part d'emblée en son nom (`pour-moi`).
 * Les deux routes utilisées sont indexées par agent, donc sans permission
 * particulière : `conges/agents/{id}/demandes` et `…/soldes`.
 *
 * Le **congé annuel** a son propre bloc (`/conges-annuels`, note FE §2c) : la
 * campagne en cours dit quel dépôt est possible — proposition pendant
 * l'ouverture, droit acquis après la clôture ensuite — et le solde annuel
 * annonce la durée qui sera posée. Les autres types restent sur « Demander un
 * congé ».
 */
const auth = useAuthStore();
const demandesApi = useDemandesCongeApi();
const soldesApi = useCongeSoldesApi();

const agentId = computed(() => auth.user?.agent_id ?? 0);
const sansAgent = computed(() => !agentId.value);

const { data, pending, error, refresh } = useAsyncData(
  () => `mes-demandes-conge-${agentId.value}`,
  () => (agentId.value ? demandesApi.byAgent(agentId.value) : Promise.resolve(null)),
  { watch: [agentId] },
);
const demandes = computed(() => data.value?.data ?? []);

const { data: soldesData } = useAsyncData(
  () => `mes-soldes-conge-${agentId.value}`,
  () => (agentId.value ? soldesApi.byAgent(agentId.value) : Promise.resolve(null)),
  { watch: [agentId] },
);
const soldes = computed(() => soldesData.value?.data ?? []);

const peutCreer = computed(() => auth.can("creer-conges"));
const modalOpen = ref(false);

// — Congé annuel ——————————————————————————————————————————————
const annuelsApi = useCongesAnnuelsApi();
const { courante: campagne } = useCampagnesCongeAnnuel(() => !!agentId.value);
const anneeAnnuel = computed(() => campagne.value?.annee ?? new Date().getFullYear());
const origine = computed(() => origineDepot(campagne.value));

const { data: soldeAnnuelData, refresh: refreshSoldeAnnuel } = useAsyncData(
  () => `mon-solde-annuel-${agentId.value}-${anneeAnnuel.value}`,
  () => (agentId.value ? annuelsApi.solde(agentId.value, anneeAnnuel.value) : Promise.resolve(null)),
  { watch: [agentId, anneeAnnuel] },
);
const soldeAnnuel = computed(() => soldeAnnuelData.value?.data ?? null);

// Une proposition non annulée existe-t-elle déjà pour cette campagne ?
const propositionEnCours = computed(() =>
  demandes.value.find(
    (d) =>
      d.campagne_conge_annuel_id != null
      && d.campagne_conge_annuel_id === campagne.value?.id
      && !["annulee", "rejetee_n1", "rejetee_rh"].includes(d.statut ?? ""),
  ) ?? null,
);

const annuelOpen = ref(false);
async function onAnnuelCree() {
  await Promise.all([refresh(), refreshSoldeAnnuel()]);
}

const ETAPE_LABEL: Record<EtapeConge, string> = {
  "valider-n1": "Attente N+1",
  "valider-rh": "Attente RH",
  "valider-dg": "Attente DG",
};

const columns: TableColumn<DemandeConge>[] = [
  { id: "type", header: "Type", cell: ({ row }) => libelleTypeDemande(row.original) },
  {
    id: "periode",
    header: "Période",
    cell: ({ row }) => formatPeriode(row.original.date_debut, row.original.date_fin),
  },
  { accessorKey: "nb_jours", header: "Jours" },
  { id: "statut", header: "Statut" },
];
</script>

<template>
  <BasePanel title="Mes congés" subtitle="Vos demandes et vos droits acquis">
    <template #actions>
      <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" to="/mon-espace">Retour</UButton>
    </template>

    <UAlert
      v-if="sansAgent"
      color="warning"
      variant="subtle"
      icon="i-lucide-user-x"
      title="Aucun agent rattaché à votre compte"
      description="Votre compte n'est lié à aucun dossier d'agent : vous n'avez ni solde ni demande de congé."
    />

    <div v-else class="space-y-6">
      <!-- Mes soldes : ce qui reste, par type de congé -->
      <div v-if="soldes.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <BaseStatCard
          v-for="solde in soldes"
          :key="solde.id"
          :label="solde.type_conge?.nom ?? `Type #${solde.type_conge_id}`"
          :value="`${solde.solde_actuel ?? 0} j`"
          icon="i-lucide-palmtree"
          :hint="
            [
              solde.jours_anciennete
                ? `Sur ${solde.solde_initial ?? 0} j, dont ${solde.jours_anciennete} j d'ancienneté`
                : `Sur ${solde.solde_initial ?? 0} j acquis`,
              solde.jours_reportes ? `dont ${solde.jours_reportes} j reportés` : null,
            ].filter(Boolean).join(' · ')
          "
        />
      </div>

      <!-- Congé annuel : campagne, durée posée, dépôt -->
      <div class="rounded-xl border border-default bg-default p-5">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="min-w-0 space-y-1">
            <BaseCardTitle icon="i-lucide-palmtree" :title="`Congé annuel ${anneeAnnuel}`" />
            <p v-if="!campagne" class="text-sm text-muted">
              Aucune campagne n'est encore programmée pour {{ anneeAnnuel }}.
            </p>
            <p v-else class="flex flex-wrap items-center gap-2 text-sm text-muted">
              <UBadge :color="STATUT_CAMPAGNE_COLOR[campagne.statut]" variant="subtle" size="sm">
                Campagne {{ (campagne.statut_label ?? STATUT_CAMPAGNE_LABEL[campagne.statut]).toLowerCase() }}
              </UBadge>
              <span>{{ formatPeriode(campagne.date_ouverture, campagne.date_cloture) }}</span>
            </p>
            <p v-if="soldeAnnuel" class="text-sm text-default">
              <span class="font-semibold text-highlighted">{{ Math.floor(soldeAnnuel.solde_actuel) }} j ouvrables</span>
              à poser
              <template v-if="soldeAnnuel.jours_reportes">, dont {{ soldeAnnuel.jours_reportes }} j reportés de {{ anneeAnnuel - 1 }}</template>
            </p>
            <p v-if="origine === 'apres_cloture' && !propositionEnCours" class="text-xs text-muted">
              Campagne close : seul l'agent qui n'avait pas 12 mois de service à la clôture peut encore déposer.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <UButton
              v-if="propositionEnCours"
              color="neutral"
              variant="soft"
              icon="i-lucide-eye"
              :to="`/conges/demandes/${propositionEnCours.id}`"
            >
              Ma proposition
            </UButton>
            <UButton
              v-else-if="peutCreer && origine"
              icon="i-lucide-calendar-plus"
              :variant="origine === 'campagne' ? 'solid' : 'soft'"
              @click="annuelOpen = true"
            >
              {{ origine === "campagne" ? "Proposer mon congé annuel" : "Déposer (droit acquis après clôture)" }}
            </UButton>
          </div>
        </div>
      </div>

      <BaseDataState :pending="pending" :error="error">
        <BaseTable
          :data="demandes"
          :columns="columns"
          :page-size="10"
          :row-to="(d) => `/conges/demandes/${d.id}`"
        >
          <template #actions>
            <UButton v-if="peutCreer" icon="i-lucide-plus" @click="modalOpen = true">Demander un congé</UButton>
          </template>
          <template #empty>
            <p class="py-6 text-center text-sm text-muted">Vous n'avez déposé aucune demande de congé.</p>
          </template>
          <template #statut-cell="{ row }">
            <div class="flex items-center gap-2">
              <CongesDemandeStatutBadge
                :statut="row!.original.statut"
                :label="row!.original.statut_label ?? STATUT_DEMANDE_LABEL[row!.original.statut!]"
              />
              <UBadge v-if="row!.original.prochaine_etape" color="neutral" variant="outline" size="sm">
                {{ ETAPE_LABEL[row!.original.prochaine_etape] }}
              </UBadge>
            </div>
          </template>
        </BaseTable>
      </BaseDataState>
    </div>

    <CongesDemandeModal v-model:open="modalOpen" pour-moi @created="refresh" />
    <CongesCongeAnnuelModal
      v-if="origine"
      v-model:open="annuelOpen"
      :origine="origine"
      :agent-id="agentId"
      :annee="anneeAnnuel"
      @created="onAnnuelCree"
    />
  </BasePanel>
</template>
