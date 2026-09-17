<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { AyantDroit } from "~/schemas/ayant-droit";
import { TYPES_AYANT_DROIT } from "~/constants/enums";
import { agentNom, TYPE_AYANT_DROIT_LABEL, type TypeAyantDroit } from "~/constants/social";

/**
 * Ayants droit des agents (CCN art. 58–59). `a_charge` et
 * `eligible_arbre_noel` sont calculés par l'API à partir de l'âge et du régime
 * d'âge : on les affiche, on ne les recalcule jamais.
 */
const api = useAyantsDroitApi();
const auth = useAuthStore();
const handleError = useApiError();

const peutGerer = computed(() => auth.can("gerer-affaires-sociales"));

const filters = reactive<Record<string, string | number | undefined>>({});
const { data, pending, error, refresh } = useAsyncData(
  "ayants-droit",
  () => api.list({ ...filters }),
  { watch: [filters] },
);
const ayantsDroit = computed(() => data.value?.data ?? []);

const ALL = "__all__";
const typeItems = [
  { label: "Toutes les qualités", value: ALL },
  ...TYPES_AYANT_DROIT.map((t) => ({ label: TYPE_AYANT_DROIT_LABEL[t], value: t })),
];
const type = ref<string>(ALL);
watch(type, (v) => (v === ALL ? delete filters.type : (filters.type = v)));

const modalOpen = ref(false);
const editing = ref<AyantDroit | null>(null);

function ouvrir(ayantDroit?: AyantDroit) {
  editing.value = ayantDroit ?? null;
  modalOpen.value = true;
}

async function supprimer(ayantDroit: AyantDroit) {
  if (!confirm(`Retirer ${ayantDroit.nom_complet ?? ayantDroit.nom} du dossier ?`)) return;
  try {
    await api.remove(ayantDroit.id);
    await refresh();
  } catch (err) {
    handleError(err);
  }
}

const columns: TableColumn<AyantDroit>[] = [
  {
    id: "agent",
    header: "Agent",
    accessorFn: (a) => agentNom(a.agent),
    cell: ({ row }) => agentNom(row.original.agent),
  },
  {
    id: "identite",
    header: "Ayant droit",
    accessorFn: (a) => a.nom_complet ?? `${a.nom} ${a.prenom}`,
    cell: ({ row }) => row.original.nom_complet ?? `${row.original.nom} ${row.original.prenom}`,
  },
  { id: "qualite", header: "Qualité" },
  { id: "age", header: "Âge" },
  { id: "charge", header: "Prise en charge" },
  { id: "actions", header: "" },
];
</script>

<template>
  <BasePanel title="Ayants droit" subtitle="Conjoints et enfants à charge (art. 58–59)">
    <BaseDataState :pending="pending" :error="error">
      <BaseTable
        :data="ayantsDroit"
        :columns="columns"
        searchable
        search-placeholder="Rechercher un agent ou un ayant droit…"
        :page-size="10"
      >
        <template #filters>
          <USelect v-model="type" :items="typeItems" class="w-48" />
        </template>
        <template #actions>
          <UButton v-if="peutGerer" icon="i-lucide-plus" @click="ouvrir()">Nouvel ayant droit</UButton>
        </template>
        <template #empty>
          <p class="py-6 text-center text-sm text-muted">Aucun ayant droit</p>
        </template>
        <template #qualite-cell="{ row }">
          <div class="flex items-center gap-2">
            <span class="text-sm">
              {{ row!.original.type_label ?? TYPE_AYANT_DROIT_LABEL[row!.original.type as TypeAyantDroit] }}
            </span>
            <UBadge v-if="row!.original.lien_juridique_label" color="neutral" variant="outline" size="sm">
              {{ row!.original.lien_juridique_label }}
            </UBadge>
          </div>
        </template>
        <template #age-cell="{ row }">
          <span class="text-sm">
            {{ row!.original.age != null ? `${row!.original.age} ans` : "—" }}
            <span v-if="row!.original.age_limite" class="text-muted">/ {{ row!.original.age_limite }}</span>
          </span>
        </template>
        <template #charge-cell="{ row }">
          <div class="flex items-center gap-2">
            <UBadge :color="row!.original.a_charge ? 'success' : 'neutral'" variant="subtle" size="sm">
              {{ row!.original.a_charge ? "À charge" : "Hors charge" }}
            </UBadge>
            <UBadge v-if="row!.original.eligible_arbre_noel" color="primary" variant="outline" size="sm">
              Arbre de Noël
            </UBadge>
          </div>
        </template>
        <template #actions-cell="{ row }">
          <div v-if="peutGerer" class="flex justify-end gap-1">
            <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-pencil" @click="ouvrir(row!.original)" />
            <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-trash-2" @click="supprimer(row!.original)" />
          </div>
        </template>
      </BaseTable>
    </BaseDataState>

    <SocialAyantDroitModal v-model:open="modalOpen" :ayant-droit="editing" @saved="refresh" />
  </BasePanel>
</template>
