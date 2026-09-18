<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { VisiteMedicale, VisiteMedicaleInput } from "~/schemas/visite-medicale";
import { TYPES_VISITE_MEDICALE } from "~/constants/enums";
import { agentNom, TYPE_VISITE_LABEL, type TypeVisiteMedicale } from "~/constants/dossiers-sociaux";

/**
 * Visites médicales (D.3.5).
 *
 * Une visite n'a pas de circuit : elle est **constatée**, pas instruite. Le
 * seul enjeu est la visite **annuelle**, obligatoire : l'écran ouvre donc sur
 * la liste des agents qui n'en ont pas — c'est l'action, le reste est l'archive.
 */
const api = useVisitesMedicalesApi();
const acteur = useActeurDossierSocial();
const toast = useToast();
const handleError = useApiError();

const { data, pending, error, refresh } = useAsyncData("visites-medicales", () => api.list());
const visites = computed(() => data.value?.data ?? []);

/** Agents présents sans visite annuelle : la seule alerte du module. */
const { data: alertesData } = useAsyncData("visites-alertes", () => api.alertesAnnuelles());
const manquantes = computed(() => alertesData.value?.data ?? []);

const ALL = "__all__";
const typeItems = [
  { label: "Tous les types", value: ALL },
  ...TYPES_VISITE_MEDICALE.map((t) => ({ label: TYPE_VISITE_LABEL[t], value: t })),
];
const type = ref<string>(ALL);
const rows = computed(() =>
  type.value === ALL ? visites.value : visites.value.filter((v) => v.type === type.value),
);

// ── Création ────────────────────────────────────────────────────────────────

const open = ref(false);
const busy = ref(false);

// État du formulaire (sans `null` : les contrôles de saisie veulent `undefined`).
const agentId = ref<number | undefined>(undefined);
const typeChoisi = ref<TypeVisiteMedicale | undefined>(undefined);
const dateVisite = ref<string | undefined>(undefined);
const structureId = ref<number | undefined>(undefined);
const observations = ref("");

const { options: agentOptions } = useResourceOptions(
  "visite-agents",
  () => useAgentsApi().list(),
  (a) => agentNom(a),
);
const { options: structureOptions } = useResourceOptions("visite-structures", () =>
  useStructuresSanitairesApi().list({ actif: true }),
);

/** Ouvre le formulaire, éventuellement pré-rempli depuis une alerte. */
function ouvrir(agent?: { id: number }) {
  agentId.value = agent?.id;
  typeChoisi.value = agent ? "annuelle" : undefined;
  dateVisite.value = undefined;
  structureId.value = undefined;
  observations.value = "";
  open.value = true;
}

async function enregistrer() {
  if (!agentId.value || !typeChoisi.value || !dateVisite.value || !structureId.value) {
    toast.add({ title: "Agent, type, date et structure sont requis.", color: "error" });
    return;
  }
  busy.value = true;
  try {
    const payload: VisiteMedicaleInput = {
      agent_id: agentId.value,
      type: typeChoisi.value,
      date_visite: dateVisite.value,
      structure_sanitaire_id: structureId.value,
      observations: observations.value.trim() || null,
    };
    await api.create(payload);
    toast.add({ title: "Visite enregistrée", color: "success" });
    open.value = false;
    await refresh();
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

async function supprimer(visite: VisiteMedicale) {
  if (!confirm("Supprimer cette visite ?")) return;
  try {
    await api.remove(visite.id);
    await refresh();
  } catch (err) {
    handleError(err);
  }
}

const columns: TableColumn<VisiteMedicale>[] = [
  {
    id: "agent",
    header: "Agent",
    accessorFn: (v) => agentNom(v.agent),
    cell: ({ row }) => agentNom(row.original.agent),
  },
  { id: "type", header: "Type" },
  {
    id: "date",
    header: "Date",
    cell: ({ row }) => formatDate(row.original.date_visite),
  },
  { id: "structure", header: "Structure" },
  { id: "observations", header: "Observations" },
  { id: "actions", header: "" },
];
</script>

<template>
  <BasePanel title="Visites médicales" subtitle="Embauche, visite annuelle, consultations">
    <!--
      L'alerte passe avant la liste : c'est elle qui appelle une action. La
      liste des visites déjà faites, elle, ne demande rien à personne.
    -->
    <div
      v-if="manquantes.length"
      class="mb-4 rounded-xl border border-warning/40 bg-warning/5 p-5"
    >
      <div class="flex items-start gap-3">
        <UIcon name="i-lucide-triangle-alert" class="mt-0.5 size-5 shrink-0 text-warning" />
        <div class="min-w-0 flex-1">
          <p class="font-medium text-highlighted">
            {{ manquantes.length }} agent{{ manquantes.length > 1 ? "s" : "" }}
            sans visite annuelle
          </p>
          <p class="mt-1 text-sm text-muted">
            La visite annuelle est obligatoire. Ces agents n'en ont pas sur la période courante.
          </p>
          <ul class="mt-3 flex flex-wrap gap-2">
            <li v-for="agent in manquantes.slice(0, 12)" :key="agent.id">
              <UButton
                size="xs"
                color="neutral"
                variant="outline"
                :disabled="!acteur.peutGerer"
                @click="ouvrir(agent)"
              >
                {{ agentNom(agent) }}
              </UButton>
            </li>
            <li v-if="manquantes.length > 12" class="self-center text-xs text-muted">
              et {{ manquantes.length - 12 }} autre{{ manquantes.length - 12 > 1 ? "s" : "" }}…
            </li>
          </ul>
        </div>
      </div>
    </div>

    <BaseDataState :pending="pending" :error="error">
      <BaseTable
        :data="rows"
        :columns="columns"
        searchable
        search-placeholder="Rechercher un agent…"
        :page-size="10"
      >
        <template #filters>
          <USelect v-model="type" :items="typeItems" class="w-48" />
        </template>
        <template #actions>
          <UButton v-if="acteur.peutGerer" icon="i-lucide-plus" @click="ouvrir()">
            Enregistrer une visite
          </UButton>
        </template>
        <template #empty>
          <p class="py-6 text-center text-sm text-muted">Aucune visite enregistrée</p>
        </template>

        <template #type-cell="{ row }">
          <span class="text-sm">
            {{ row!.original.type_label ?? (row!.original.type ? TYPE_VISITE_LABEL[row!.original.type] : "—") }}
          </span>
        </template>
        <template #structure-cell="{ row }">
          <span class="text-sm text-muted">{{ row!.original.structure?.nom ?? "—" }}</span>
        </template>
        <template #observations-cell="{ row }">
          <span class="line-clamp-1 text-sm text-muted">{{ row!.original.observations ?? "—" }}</span>
        </template>
        <template #actions-cell="{ row }">
          <div class="flex justify-end">
            <UButton
              v-if="acteur.peutGerer"
              size="xs"
              color="neutral"
              variant="ghost"
              icon="i-lucide-trash-2"
              @click="supprimer(row!.original)"
            />
          </div>
        </template>
      </BaseTable>
    </BaseDataState>

    <UModal v-model:open="open" title="Enregistrer une visite médicale">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Agent" name="agent_id" required>
            <USelectMenu
              v-model="agentId"
              :items="agentOptions"
              value-key="value"
              placeholder="Sélectionner un agent"
              class="w-full"
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Type de visite" name="type" required>
              <USelectMenu
                v-model="typeChoisi"
                :items="TYPES_VISITE_MEDICALE.map((t) => ({ label: TYPE_VISITE_LABEL[t], value: t }))"
                value-key="value"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Date de la visite" name="date_visite" required>
              <UInput v-model="dateVisite" type="date" class="w-full" />
            </UFormField>
          </div>

          <UFormField label="Structure sanitaire" name="structure_sanitaire_id" required>
            <USelectMenu
              v-model="structureId"
              :items="structureOptions"
              value-key="value"
              placeholder="Sélectionner"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Observations" name="observations" help="Aptitude, réserves, suivi à prévoir.">
            <UTextarea v-model="observations" :rows="3" class="w-full" />
          </UFormField>

          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
            <UButton :loading="busy" @click="enregistrer">Enregistrer</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </BasePanel>
</template>
