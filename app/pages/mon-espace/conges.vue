<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { DemandeConge } from "~/schemas/demande-conge";
import { STATUT_DEMANDE_LABEL, type EtapeConge } from "~/constants/conges";

/**
 * Mes congés : les demandes du compte connecté et ses soldes.
 *
 * Écran **personnel**, distinct de la liste RH : pas de sélecteur de portée, pas
 * de colonne « Agent », et la demande part d'emblée en son nom (`pour-moi`).
 * Les deux routes utilisées sont indexées par agent, donc sans permission
 * particulière : `conges/agents/{id}/demandes` et `…/soldes`.
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

const ETAPE_LABEL: Record<EtapeConge, string> = {
  "valider-n1": "Attente N+1",
  "valider-rh": "Attente RH",
  "valider-dg": "Attente DG",
};

const columns: TableColumn<DemandeConge>[] = [
  { id: "type", header: "Type", cell: ({ row }) => row.original.type_conge?.nom ?? "—" },
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
            solde.jours_anciennete
              ? `Sur ${solde.solde_initial ?? 0} j, dont ${solde.jours_anciennete} j d'ancienneté`
              : `Sur ${solde.solde_initial ?? 0} j acquis`
          "
        />
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
  </BasePanel>
</template>
