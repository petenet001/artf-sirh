<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { AffiliationSociale, AffiliationSocialeInput } from "~/schemas/affiliation-sociale";
import { STATUTS_AFFILIATION } from "~/constants/enums";
import { agentNom, STATUT_AFFILIATION_LABEL } from "~/constants/social";

/**
 * Affiliations des agents aux organismes sociaux, et alerte « sans CNSS » :
 * les agents non archivés et non stagiaires qui n'ont aucune affiliation CNSS
 * active — c'est la lacune réglementaire à combler en priorité (art. 47).
 */
const api = useAffiliationsSocialesApi();
const auth = useAuthStore();
const toast = useToast();
const handleError = useApiError();

const peutGerer = computed(() => auth.can("gerer-affaires-sociales"));

const filters = reactive<Record<string, string | number | undefined>>({});
const { data, pending, error, refresh } = useAsyncData(
  "affiliations-sociales",
  () => api.list({ ...filters }),
  { watch: [filters] },
);
const affiliations = computed(() => data.value?.data ?? []);

const { data: alerteData, refresh: refreshAlerte } = useAsyncData("alerte-sans-cnss", () =>
  api.sansAffiliationCnss(),
);
const sansCnss = computed(() => alerteData.value?.data ?? []);

const ALL = "__all__";
const statutItems = [
  { label: "Tous les statuts", value: ALL },
  ...STATUTS_AFFILIATION.map((s) => ({ label: STATUT_AFFILIATION_LABEL[s], value: s })),
];
const statut = ref<string>(ALL);
watch(statut, (v) => (v === ALL ? delete filters.statut : (filters.statut = v)));

// — Création / édition —————————————————————————————————————————
const { options: agentOptions } = useResourceOptions("affiliation-agents", () => useAgentsApi().list(), (a) =>
  agentNom(a),
);
const { data: organismesData } = useAsyncData("affiliation-organismes", () =>
  useOrganismesSociauxApi().list(),
);
const organismeOptions = computed(() =>
  (organismesData.value?.data ?? []).map((o) => ({ label: o.nom, value: o.id })),
);

/** État du formulaire (sans `null` : les contrôles n'acceptent que `string | undefined`). */
interface AffiliationForm {
  agent_id?: number;
  organisme_id?: number;
  numero_affiliation?: string;
  date_debut?: string;
  date_fin?: string;
  statut?: (typeof STATUTS_AFFILIATION)[number];
  notes?: string;
}
const state = reactive<AffiliationForm>({});
const open = ref(false);
const editing = ref<AffiliationSociale | null>(null);
const submitting = ref(false);

function ouvrir(affiliation?: AffiliationSociale, agentId?: number) {
  editing.value = affiliation ?? null;
  state.agent_id = affiliation?.agent_id ?? affiliation?.agent?.id ?? agentId;
  state.organisme_id = affiliation?.organisme_id ?? affiliation?.organisme?.id ?? undefined;
  state.numero_affiliation = affiliation?.numero_affiliation ?? undefined;
  state.date_debut = affiliation?.date_debut ?? undefined;
  state.date_fin = affiliation?.date_fin ?? undefined;
  state.statut = affiliation?.statut ?? "active";
  state.notes = affiliation?.notes ?? undefined;
  open.value = true;
}

async function enregistrer() {
  if (!state.agent_id || !state.organisme_id || !state.date_debut) {
    toast.add({ title: "Agent, organisme et date de début sont requis.", color: "error" });
    return;
  }
  submitting.value = true;
  try {
    const payload: AffiliationSocialeInput = {
      agent_id: state.agent_id,
      organisme_id: state.organisme_id,
      numero_affiliation: state.numero_affiliation?.trim() || null,
      date_debut: state.date_debut,
      date_fin: state.date_fin || null,
      statut: state.statut ?? "active",
      notes: state.notes?.trim() || null,
    };
    if (editing.value) await api.update(editing.value.id, payload);
    else await api.create(payload);
    toast.add({ title: editing.value ? "Affiliation mise à jour" : "Affiliation créée", color: "success" });
    open.value = false;
    await Promise.all([refresh(), refreshAlerte()]);
  } catch (err) {
    handleError(err);
  } finally {
    submitting.value = false;
  }
}

async function supprimer(affiliation: AffiliationSociale) {
  if (!confirm("Supprimer cette affiliation ?")) return;
  try {
    await api.remove(affiliation.id);
    await Promise.all([refresh(), refreshAlerte()]);
  } catch (err) {
    handleError(err);
  }
}

const columns: TableColumn<AffiliationSociale>[] = [
  {
    id: "agent",
    header: "Agent",
    accessorFn: (a) => agentNom(a.agent),
    cell: ({ row }) => agentNom(row.original.agent),
  },
  { id: "organisme", header: "Organisme" },
  { accessorKey: "numero_affiliation", header: "N° d'affiliation" },
  { id: "periode", header: "Période" },
  { id: "statut", header: "Statut" },
  { id: "actions", header: "" },
];
</script>

<template>
  <BasePanel title="Affiliations sociales" subtitle="Rattachement des agents aux organismes">
    <div class="space-y-6">
      <!-- Alerte réglementaire : la CNSS est obligatoire (art. 47) -->
      <UAlert
        v-if="sansCnss.length"
        color="warning"
        variant="subtle"
        icon="i-lucide-alert-triangle"
        :title="`${sansCnss.length} agent(s) sans affiliation CNSS active`"
      >
        <template #description>
          <div class="mt-2 flex flex-wrap gap-2">
            <UButton
              v-for="agent in sansCnss.slice(0, 12)"
              :key="agent.id"
              size="xs"
              color="neutral"
              variant="soft"
              :disabled="!peutGerer"
              @click="ouvrir(undefined, agent.id)"
            >
              {{ agentNom(agent) }}
            </UButton>
            <span v-if="sansCnss.length > 12" class="self-center text-xs text-muted">
              et {{ sansCnss.length - 12 }} autre(s)…
            </span>
          </div>
        </template>
      </UAlert>

      <BaseDataState :pending="pending" :error="error">
        <BaseTable
          :data="affiliations"
          :columns="columns"
          searchable
          search-placeholder="Rechercher un agent…"
          :page-size="10"
        >
          <template #filters>
            <USelect v-model="statut" :items="statutItems" class="w-44" />
          </template>
          <template #actions>
            <UButton v-if="peutGerer" icon="i-lucide-plus" @click="ouvrir()">Nouvelle affiliation</UButton>
          </template>
          <template #empty>
            <p class="py-6 text-center text-sm text-muted">Aucune affiliation</p>
          </template>
          <template #organisme-cell="{ row }">
            <span class="text-sm">{{ row!.original.organisme?.nom ?? "—" }}</span>
          </template>
          <template #periode-cell="{ row }">
            <span class="text-sm text-muted">
              {{ formatPeriode(row!.original.date_debut, row!.original.date_fin) }}
            </span>
          </template>
          <template #statut-cell="{ row }">
            <SocialStatutAffiliationBadge :statut="row!.original.statut" :label="row!.original.statut_label" />
          </template>
          <template #actions-cell="{ row }">
            <div v-if="peutGerer" class="flex justify-end gap-1">
              <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-pencil" @click="ouvrir(row!.original)" />
              <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-trash-2" @click="supprimer(row!.original)" />
            </div>
          </template>
        </BaseTable>
      </BaseDataState>
    </div>

    <UModal v-model:open="open" :title="editing ? 'Modifier l\'affiliation' : 'Nouvelle affiliation'">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Agent" name="agent_id" required>
            <USelectMenu
              v-model="state.agent_id"
              :items="agentOptions"
              value-key="value"
              :disabled="!!editing"
              placeholder="Sélectionner un agent"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Organisme" name="organisme_id" required>
            <USelect v-model="state.organisme_id" :items="organismeOptions" value-key="value" class="w-full" />
          </UFormField>
          <UFormField
            label="Numéro d'affiliation"
            name="numero_affiliation"
            help="CNSS : laisser vide pour reprendre le numéro déjà connu de l'agent."
          >
            <UInput v-model="state.numero_affiliation" class="w-full" />
          </UFormField>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Début" name="date_debut" required>
              <UInput v-model="state.date_debut" type="date" class="w-full" />
            </UFormField>
            <UFormField label="Fin" name="date_fin">
              <UInput v-model="state.date_fin" type="date" class="w-full" />
            </UFormField>
          </div>
          <UFormField label="Statut" name="statut">
            <USelect
              v-model="state.statut"
              :items="STATUTS_AFFILIATION.map((s) => ({ label: STATUT_AFFILIATION_LABEL[s], value: s }))"
              value-key="value"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Notes" name="notes">
            <UTextarea v-model="state.notes" :rows="3" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
            <UButton :loading="submitting" @click="enregistrer">Enregistrer</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </BasePanel>
</template>
