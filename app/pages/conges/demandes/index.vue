<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { DemandeConge } from "~/schemas/demande-conge";
import { STATUTS_DEMANDE_CONGE } from "~/constants/enums";
import { agentNom, STATUT_DEMANDE_LABEL, type EtapeConge } from "~/constants/conges";

/**
 * Liste des demandes de congé. Portées : « Mes demandes » (agent connecté),
 * « À valider » (file du signataire, calculée par l'API) et « Toutes » (RH /
 * valideurs) ; filtre statut client sur la collection reçue. Une ligne mène au
 * détail (circuit + actions).
 */
const auth = useAuthStore();
const { demandes, scope, pending, error, refresh } = useDemandesConge();

const peutValider = computed(() => auth.can("valider-conges"));
const peutVoirToutes = computed(() => peutValider.value || auth.hasRole("rh") || auth.hasRole("admin"));
const peutCreer = computed(() => auth.can("creer-conges"));

const scopeItems = computed(() => [
  ...(auth.user?.agent_id ? [{ label: "Mes demandes", value: "mine" as const }] : []),
  ...(peutValider.value ? [{ label: "À valider", value: "a_valider" as const }] : []),
  ...(peutVoirToutes.value ? [{ label: "Toutes les demandes", value: "all" as const }] : []),
]);

const ALL = "__all__";
const statutItems = [
  { label: "Tous les statuts", value: ALL },
  ...STATUTS_DEMANDE_CONGE.map((s) => ({ label: STATUT_DEMANDE_LABEL[s], value: s })),
];
const statut = ref<string>(ALL);
const rows = computed(() =>
  statut.value === ALL ? demandes.value : demandes.value.filter((d) => d.statut === statut.value),
);

const ETAPE_LABEL: Record<EtapeConge, string> = {
  "valider-n1": "Attente N+1",
  "valider-rh": "Attente RH",
  "valider-dg": "Attente DG",
};

const modalOpen = ref(false);

const columns: TableColumn<DemandeConge>[] = [
  { id: "agent", header: "Agent", accessorFn: (d) => agentNom(d.agent), cell: ({ row }) => agentNom(row.original.agent) },
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
  <BasePanel title="Demandes de congé" subtitle="Suivi et validation des demandes">
    <!-- Pas d'état « vide » global : la table reste visible pour garder le
         sélecteur de portée et le bouton de création. -->
    <BaseDataState :pending="pending" :error="error">
      <BaseTable
        :data="rows"
        :columns="columns"
        searchable
        search-placeholder="Rechercher un agent…"
        :page-size="10"
        :row-to="(d) => `/conges/demandes/${d.id}`"
      >
        <template #filters>
          <USelect v-if="scopeItems.length > 1" v-model="scope" :items="scopeItems" value-key="value" class="w-48" />
          <USelect v-model="statut" :items="statutItems" class="w-48" />
        </template>
        <template #actions>
          <UButton v-if="peutCreer" icon="i-lucide-plus" @click="modalOpen = true">Nouvelle demande</UButton>
        </template>
        <template #empty>
          <p class="py-6 text-center text-sm text-muted">
            {{ scope === "a_valider" ? "Aucune demande à valider" : "Aucune demande" }}
          </p>
        </template>
        <template #statut-cell="{ row }">
          <div class="flex items-center gap-2">
            <CongesDemandeStatutBadge :statut="row!.original.statut" :label="row!.original.statut_label" />
            <UBadge v-if="row!.original.prochaine_etape" color="neutral" variant="outline" size="sm">
              {{ ETAPE_LABEL[row!.original.prochaine_etape] }}
            </UBadge>
          </div>
        </template>
      </BaseTable>
    </BaseDataState>

    <CongesDemandeModal v-model:open="modalOpen" @created="refresh" />
  </BasePanel>
</template>
