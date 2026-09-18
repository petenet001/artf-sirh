<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Prestation, PrestationInput } from "~/schemas/prestation";
import { STATUTS_DOSSIER_SOCIAL, TYPES_PRESTATION } from "~/constants/enums";
import {
  agentNom,
  ARTICLE_PRESTATION,
  formatMontant,
  montantSaisi,
  prestationDeDeces,
  STATUT_DOSSIER_SOCIAL_COLOR,
  STATUT_DOSSIER_SOCIAL_LABEL,
  TYPE_PRESTATION_LABEL,
  type TypePrestation,
} from "~/constants/dossiers-sociaux";

/**
 * Prestations sociales CCN ponctuelles (art. 119–121) : capital décès, prime
 * enfants, frais funéraires, allocation décès retraité, indemnité de retraite.
 *
 * À ne pas confondre avec les allocations familiales et autres versements
 * calendaires (art. 58–59), qui tombent automatiquement en paie sans demande.
 * L'écran le dit en sous-titre : c'est la confusion la plus probable.
 */
const api = usePrestationsApi();
const acteur = useActeurDossierSocial();
const toast = useToast();
const handleError = useApiError();

const { data, pending, error } = useAsyncData("prestations", () => api.list());
const prestations = computed(() => data.value?.data ?? []);

const ALL = "__all__";
const statutItems = [
  { label: "Tous les statuts", value: ALL },
  ...STATUTS_DOSSIER_SOCIAL.map((s) => ({ label: STATUT_DOSSIER_SOCIAL_LABEL[s], value: s })),
];
const typeItems = [
  { label: "Tous les types", value: ALL },
  ...TYPES_PRESTATION.map((t) => ({ label: TYPE_PRESTATION_LABEL[t], value: t })),
];
const statut = ref<string>(ALL);
const type = ref<string>(ALL);

const rows = computed(() =>
  prestations.value.filter(
    (p) =>
      (statut.value === ALL || p.statut === statut.value) &&
      (type.value === ALL || p.type === type.value),
  ),
);

// ── Création ────────────────────────────────────────────────────────────────

const open = ref(false);
const busy = ref(false);

// État du formulaire (sans `null` : les contrôles de saisie veulent `undefined`).
const agentId = ref<number | undefined>(undefined);
const typeChoisi = ref<TypePrestation | undefined>(undefined);
const dateFait = ref<string | undefined>(undefined);
const ayantDroitId = ref<number | undefined>(undefined);
const beneficiaire = ref("");
const transportCorps = ref(false);
const montantDemande = ref<number | undefined>(undefined);

const { options: agentOptions } = useResourceOptions(
  "prestation-agents",
  () => useAgentsApi().list(),
  (a) => agentNom(a),
);

/**
 * Ayants droit de l'agent choisi. Chargés seulement une fois l'agent connu :
 * la liste n'a aucun sens avant, et l'appel serait à refaire.
 */
const { data: ayantsDroitData } = useAsyncData(
  () => `prestation-ayants-droit-${agentId.value ?? 0}`,
  () => (agentId.value ? useAyantsDroitApi().byAgent(agentId.value) : Promise.resolve(null)),
  { watch: [agentId] },
);
const ayantDroitOptions = computed(() =>
  (ayantsDroitData.value?.data ?? []).map((a) => ({
    label: [a.prenom, a.nom].filter(Boolean).join(" ") || `Ayant droit nº ${a.id}`,
    value: a.id,
  })),
);

const saisieMontant = computed(() => montantSaisi(typeChoisi.value));
const saisieBeneficiaire = computed(() => prestationDeDeces(typeChoisi.value));

function ouvrir() {
  agentId.value = undefined;
  typeChoisi.value = undefined;
  dateFait.value = undefined;
  ayantDroitId.value = undefined;
  beneficiaire.value = "";
  transportCorps.value = false;
  montantDemande.value = undefined;
  open.value = true;
}

async function enregistrer() {
  if (!agentId.value || !typeChoisi.value || !dateFait.value) {
    toast.add({ title: "Agent, type et date du fait sont requis.", color: "error" });
    return;
  }
  busy.value = true;
  try {
    const payload: PrestationInput = {
      agent_id: agentId.value,
      type: typeChoisi.value,
      date_fait: dateFait.value,
      ayant_droit_id: ayantDroitId.value ?? null,
      beneficiaire_libelle: beneficiaire.value.trim() || null,
      transport_corps: typeChoisi.value === "frais_funeraires" ? transportCorps.value : null,
      montant_demande: saisieMontant.value ? (montantDemande.value ?? null) : null,
    };
    const { data: creee } = await api.create(payload);
    toast.add({ title: "Prestation créée en brouillon", color: "success" });
    open.value = false;
    await navigateTo(`/affaires-sociales/prestations/${creee.id}`);
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

const columns: TableColumn<Prestation>[] = [
  {
    id: "agent",
    header: "Agent",
    accessorFn: (p) => agentNom(p.agent),
    cell: ({ row }) => agentNom(row.original.agent),
  },
  { id: "type", header: "Prestation" },
  {
    id: "fait",
    header: "Date du fait",
    cell: ({ row }) => formatDate(row.original.date_fait),
  },
  { id: "montant", header: "Montant" },
  { id: "statut", header: "Statut" },
];
</script>

<template>
  <BasePanel
    title="Prestations sociales"
    subtitle="Capital décès, frais funéraires, indemnité de retraite (art. 119–121)"
  >
    <UAlert
      class="mb-4"
      color="neutral"
      variant="subtle"
      icon="i-lucide-info"
      title="Ces prestations se demandent ; les allocations familiales, non."
      description="Allocations familiales, arbre de Noël et prime de rentrée (art. 58–59) sont versées automatiquement par la paie et n'ont pas à être demandées ici."
    />

    <BaseDataState :pending="pending" :error="error">
      <BaseTable
        :data="rows"
        :columns="columns"
        searchable
        search-placeholder="Rechercher un agent…"
        :page-size="10"
        :row-to="(p) => `/affaires-sociales/prestations/${p.id}`"
      >
        <template #filters>
          <USelect v-model="statut" :items="statutItems" class="w-48" />
          <USelect v-model="type" :items="typeItems" class="w-56" />
        </template>
        <template #actions>
          <UButton v-if="acteur.peutGerer" icon="i-lucide-plus" @click="ouvrir">
            Nouvelle prestation
          </UButton>
        </template>
        <template #empty>
          <p class="py-6 text-center text-sm text-muted">Aucune prestation</p>
        </template>

        <template #type-cell="{ row }">
          <div>
            <p class="text-sm text-highlighted">
              {{ row!.original.type_label ?? (row!.original.type ? TYPE_PRESTATION_LABEL[row!.original.type] : "—") }}
            </p>
            <p class="text-xs text-muted">
              {{ row!.original.article_ccn ?? (row!.original.type ? ARTICLE_PRESTATION[row!.original.type] : "") }}
            </p>
          </div>
        </template>

        <template #montant-cell="{ row }">
          <span class="text-sm tabular-nums">
            {{ formatMontant(row!.original.montant_accorde ?? row!.original.montant_calcule ?? row!.original.montant_demande) }}
          </span>
        </template>

        <template #statut-cell="{ row }">
          <UBadge
            v-if="row!.original.statut"
            :color="STATUT_DOSSIER_SOCIAL_COLOR[row!.original.statut]"
            variant="subtle"
          >
            {{ row!.original.statut_label ?? STATUT_DOSSIER_SOCIAL_LABEL[row!.original.statut] }}
          </UBadge>
        </template>
      </BaseTable>
    </BaseDataState>

    <UModal v-model:open="open" title="Nouvelle prestation">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Agent concerné" name="agent_id" required>
            <USelectMenu
              v-model="agentId"
              :items="agentOptions"
              value-key="value"
              placeholder="Sélectionner un agent"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Type de prestation" name="type" required>
            <USelectMenu
              v-model="typeChoisi"
              :items="TYPES_PRESTATION.map((t) => ({ label: `${TYPE_PRESTATION_LABEL[t]} — ${ARTICLE_PRESTATION[t]}`, value: t }))"
              value-key="value"
              placeholder="Sélectionner"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Date du fait générateur"
            name="date_fait"
            required
            :help="typeChoisi === 'indemnite_retraite' ? 'Date d\'admission à la retraite.' : 'Date du décès.'"
          >
            <UInput v-model="dateFait" type="date" class="w-full" />
          </UFormField>

          <template v-if="saisieBeneficiaire">
            <UFormField
              label="Ayant droit bénéficiaire"
              name="ayant_droit_id"
              :help="agentId ? 'Facultatif — s\'il est déjà enregistré au dossier social.' : 'Choisissez d\'abord un agent.'"
            >
              <USelectMenu
                v-model="ayantDroitId"
                :items="ayantDroitOptions"
                value-key="value"
                :disabled="!agentId"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Bénéficiaire (à défaut)"
              name="beneficiaire_libelle"
              help="À renseigner si le bénéficiaire n'est pas un ayant droit enregistré."
            >
              <UInput v-model="beneficiaire" placeholder="Nom et qualité" class="w-full" />
            </UFormField>
          </template>

          <template v-if="saisieMontant">
            <UFormField
              label="Montant demandé"
              name="montant_demande"
              help="Dépense justifiée. Plafond conventionnel de 2 000 000 F, transport du corps compris."
            >
              <UInput v-model.number="montantDemande" type="number" min="1" class="w-full" />
            </UFormField>
            <UCheckbox v-model="transportCorps" label="Inclut le transport du corps" />
          </template>

          <p v-else-if="typeChoisi" class="text-xs text-muted">
            Le montant de cette prestation découle du barème CCN (traitement de base et prime
            d'ancienneté). Il sera calculé par l'instruction — rien à saisir.
          </p>

          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
            <UButton :loading="busy" @click="enregistrer">Créer le brouillon</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </BasePanel>
</template>
