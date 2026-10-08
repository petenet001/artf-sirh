<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { ListParams } from "~/types/api";
import type { DemandeConge } from "~/schemas/demande-conge";
import type { CampagneCongeAnnuel } from "~/schemas/conge-annuel";
import { ORIGINES_CONGE_ANNUEL, STATUTS_DEMANDE_CONGE } from "~/constants/enums";
import { agentNom, STATUT_DEMANDE_LABEL, type EtapeConge } from "~/constants/conges";
import { ORIGINE_LABEL, origineDepot } from "~/constants/conges-annuels";

/**
 * Propositions de congé annuel (`/conges-annuels/demandes`).
 *
 * Deux portées :
 * - **À traiter** : la file du signataire (`a-valider`). Une proposition de
 *   campagne n'y entre qu'**après la clôture** — liste vide pendant
 *   l'ouverture, c'est normal ;
 * - **Toutes** : filtres serveur `origine`, `statut`, `campagne_conge_annuel_id`.
 *
 * Une ligne mène au détail commun (`/conges/demandes/{id}`), qui bascule ses
 * actions sur `/conges-annuels` dès que `origine` est posée.
 */
const props = defineProps<{ campagne: CampagneCongeAnnuel | null; annee: number }>();
const campagneId = computed(() => props.campagne?.id ?? null);
const campagneStatut = computed(() => props.campagne?.statut ?? null);

const auth = useAuthStore();
const api = useCongesAnnuelsApi();

const peutValider = computed(() => auth.can("valider-conges"));
type Portee = "a_valider" | "all";
const scope = ref<Portee>(peutValider.value ? "a_valider" : "all");
const scopeItems = computed(() => [
  ...(peutValider.value ? [{ label: "À traiter", value: "a_valider" as const }] : []),
  { label: "Toutes les propositions", value: "all" as const },
]);

const ALL = "__all__";
const statut = ref<string>(ALL);
const origine = ref<string>(ALL);
const statutItems = [
  { label: "Tous les statuts", value: ALL },
  ...STATUTS_DEMANDE_CONGE.filter((s) => !s.endsWith("_dg")).map((s) => ({ label: STATUT_DEMANDE_LABEL[s], value: s })),
];
const origineItems = [
  { label: "Toutes origines", value: ALL },
  ...ORIGINES_CONGE_ANNUEL.map((o) => ({ label: ORIGINE_LABEL[o], value: o })),
];

const filtres = computed<ListParams>(() => ({
  campagne_conge_annuel_id: campagneId.value ?? undefined,
  statut: statut.value === ALL ? undefined : statut.value,
  origine: origine.value === ALL ? undefined : origine.value,
}));

const { data, pending, error, refresh } = useAsyncData(
  "conges-annuels-propositions",
  () => (scope.value === "a_valider" ? api.demandes.aValider() : api.demandes.list(filtres.value)),
  { watch: [scope, filtres] },
);
const demandes = computed(() => data.value?.data ?? []);

const { data: statsData } = useAsyncData(
  "conges-annuels-stats",
  () => api.statistiques(campagneId.value ? { campagne_conge_annuel_id: campagneId.value } : undefined),
  { watch: [campagneId] },
);
const stats = computed(() => statsData.value?.data ?? null);

const ETAPE_LABEL: Record<EtapeConge, string> = {
  "valider-n1": "Attente N+1",
  "valider-rh": "Attente RH",
  "valider-dg": "Attente DG",
};

// Pendant l'ouverture, `prochaine_etape` annonce déjà le N+1 : on ne l'affiche
// pas tant que la campagne n'est pas close (note FE §2c).
function etapeVisible(d: DemandeConge): boolean {
  if (!d.prochaine_etape) return false;
  return !(d.origine === "campagne" && campagneStatut.value === "ouverte" && d.campagne_conge_annuel_id === campagneId.value);
}

// — Saisie RH pour un agent ————————————————————————————————————————
const peutSaisir = computed(() => auth.can("creer-conges") && auth.can("consulter-agents"));
const origineSaisie = computed(() => origineDepot(props.campagne));
const saisieOpen = ref(false);

const columns: TableColumn<DemandeConge>[] = [
  { id: "agent", header: "Agent", accessorFn: (d) => agentNom(d.agent), cell: ({ row }) => agentNom(row.original.agent) },
  { id: "origine", header: "Origine", cell: ({ row }) => row.original.origine_label ?? (row.original.origine ? ORIGINE_LABEL[row.original.origine] : "—") },
  { id: "depart", header: "Départ", cell: ({ row }) => formatDate(row.original.date_debut) },
  { id: "fin", header: "Fin", cell: ({ row }) => formatDate(row.original.date_fin) },
  { id: "reprise", header: "Reprise", cell: ({ row }) => formatDate(row.original.date_reprise) },
  { accessorKey: "nb_jours", header: "Jours" },
  { id: "statut", header: "Statut" },
];
</script>

<template>
  <div class="space-y-6">
    <div v-if="stats" class="grid gap-4 sm:grid-cols-3">
      <BaseStatCard label="Propositions" :value="stats.total" icon="i-lucide-file-text" />
      <BaseStatCard
        label="En attente"
        :value="(stats.par_statut.soumise ?? 0) + (stats.par_statut.validee_n1 ?? 0)"
        icon="i-lucide-clock"
        hint="Soumises ou visées par le N+1"
      />
      <BaseStatCard label="Jours attribués" :value="stats.jours_accordes" icon="i-lucide-palmtree" />
    </div>

    <BaseDataState :pending="pending" :error="error">
      <BaseTable
        :data="demandes"
        :columns="columns"
        searchable
        search-placeholder="Rechercher un agent…"
        :page-size="10"
        :row-to="(d) => `/conges/demandes/${d.id}`"
      >
        <template #filters>
          <USelect v-if="scopeItems.length > 1" v-model="scope" :items="scopeItems" value-key="value" class="w-48" />
          <template v-if="scope === 'all'">
            <USelect v-model="origine" :items="origineItems" class="w-52" />
            <USelect v-model="statut" :items="statutItems" class="w-44" />
          </template>
        </template>
        <template #actions>
          <UButton v-if="peutSaisir && origineSaisie" icon="i-lucide-plus" @click="saisieOpen = true">
            Saisir pour un agent
          </UButton>
        </template>
        <template #empty>
          <p class="py-6 text-center text-sm text-muted">
            {{
              scope === "a_valider"
                ? campagneStatut === "ouverte"
                  ? "Rien à traiter : les propositions de campagne arrivent ici à la clôture."
                  : "Aucune proposition à traiter."
                : "Aucune proposition."
            }}
          </p>
        </template>
        <template #statut-cell="{ row }">
          <div class="flex items-center gap-2">
            <CongesDemandeStatutBadge :statut="row!.original.statut" :label="row!.original.statut_label" />
            <UBadge v-if="etapeVisible(row!.original)" color="neutral" variant="outline" size="sm">
              {{ ETAPE_LABEL[row!.original.prochaine_etape!] }}
            </UBadge>
          </div>
        </template>
      </BaseTable>
    </BaseDataState>

    <CongesCongeAnnuelModal
      v-if="origineSaisie"
      v-model:open="saisieOpen"
      :origine="origineSaisie"
      :annee="annee"
      @created="() => refresh()"
    />
  </div>
</template>
