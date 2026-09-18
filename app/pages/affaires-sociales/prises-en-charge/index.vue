<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { PriseEnCharge, PriseEnChargeInput } from "~/schemas/prise-en-charge";
import { STATUTS_DOSSIER_SOCIAL, TYPES_PRISE_EN_CHARGE } from "~/constants/enums";
import {
  agentNom,
  ARTICLE_PRISE_EN_CHARGE,
  formatMontant,
  priseEnChargeAvecSejour,
  STATUT_DOSSIER_SOCIAL_COLOR,
  STATUT_DOSSIER_SOCIAL_LABEL,
  TYPE_PRISE_EN_CHARGE_LABEL,
  type TypePriseEnCharge,
} from "~/constants/dossiers-sociaux";

/**
 * Prises en charge de frais médicaux (art. 122–127) : honoraires et soins,
 * pharmacie, verres correcteurs, hospitalisation, évacuation sanitaire.
 *
 * Les soins peuvent concerner un **ayant droit** et non l'agent : c'est la
 * famille à charge que la convention couvre, pas seulement le salarié.
 */
const api = usePrisesEnChargeApi();
const acteur = useActeurDossierSocial();
const toast = useToast();
const handleError = useApiError();

const { data, pending, error } = useAsyncData("prises-en-charge", () => api.list());
const prises = computed(() => data.value?.data ?? []);

const ALL = "__all__";
const statutItems = [
  { label: "Tous les statuts", value: ALL },
  ...STATUTS_DOSSIER_SOCIAL.map((s) => ({ label: STATUT_DOSSIER_SOCIAL_LABEL[s], value: s })),
];
const typeItems = [
  { label: "Tous les types", value: ALL },
  ...TYPES_PRISE_EN_CHARGE.map((t) => ({ label: TYPE_PRISE_EN_CHARGE_LABEL[t], value: t })),
];
const statut = ref<string>(ALL);
const type = ref<string>(ALL);

const rows = computed(() =>
  prises.value.filter(
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
const typeChoisi = ref<TypePriseEnCharge | undefined>(undefined);
const dateSoins = ref<string | undefined>(undefined);
const structureId = ref<number | undefined>(undefined);
const ayantDroitId = ref<number | undefined>(undefined);
const montantFacture = ref<number | undefined>(undefined);
const dateDebut = ref<string | undefined>(undefined);
const dateFin = ref<string | undefined>(undefined);
const lieu = ref("");
const atMp = ref(false);

const { options: agentOptions } = useResourceOptions(
  "pec-agents",
  () => useAgentsApi().list(),
  (a) => agentNom(a),
);
const { options: structureOptions } = useResourceOptions("pec-structures", () =>
  useStructuresSanitairesApi().list({ actif: true }),
);

const { data: ayantsDroitData } = useAsyncData(
  () => `pec-ayants-droit-${agentId.value ?? 0}`,
  () => (agentId.value ? useAyantsDroitApi().byAgent(agentId.value) : Promise.resolve(null)),
  { watch: [agentId] },
);
const ayantDroitOptions = computed(() =>
  (ayantsDroitData.value?.data ?? []).map((a) => ({
    label: [a.prenom, a.nom].filter(Boolean).join(" ") || `Ayant droit nº ${a.id}`,
    value: a.id,
  })),
);

const avecSejour = computed(() => priseEnChargeAvecSejour(typeChoisi.value));

function ouvrir() {
  agentId.value = undefined;
  typeChoisi.value = undefined;
  dateSoins.value = undefined;
  structureId.value = undefined;
  ayantDroitId.value = undefined;
  montantFacture.value = undefined;
  dateDebut.value = undefined;
  dateFin.value = undefined;
  lieu.value = "";
  atMp.value = false;
  open.value = true;
}

async function enregistrer() {
  if (!agentId.value || !typeChoisi.value || !dateSoins.value || !structureId.value) {
    toast.add({ title: "Agent, type, date des soins et structure sont requis.", color: "error" });
    return;
  }
  busy.value = true;
  try {
    const payload: PriseEnChargeInput = {
      agent_id: agentId.value,
      type: typeChoisi.value,
      date_soins: dateSoins.value,
      structure_sanitaire_id: structureId.value,
      ayant_droit_id: ayantDroitId.value ?? null,
      montant_facture: montantFacture.value ?? null,
      date_debut: avecSejour.value ? (dateDebut.value ?? null) : null,
      date_fin: avecSejour.value ? (dateFin.value ?? null) : null,
      lieu: lieu.value.trim() || null,
      at_mp: atMp.value,
    };
    const { data: creee } = await api.create(payload);
    toast.add({ title: "Prise en charge créée en brouillon", color: "success" });
    open.value = false;
    await navigateTo(`/affaires-sociales/prises-en-charge/${creee.id}`);
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

const columns: TableColumn<PriseEnCharge>[] = [
  {
    id: "agent",
    header: "Agent",
    accessorFn: (p) => agentNom(p.agent),
    cell: ({ row }) => agentNom(row.original.agent),
  },
  { id: "type", header: "Nature des frais" },
  {
    id: "soins",
    header: "Date des soins",
    cell: ({ row }) => formatDate(row.original.date_soins),
  },
  { id: "montant", header: "Facturé / accordé" },
  { id: "statut", header: "Statut" },
];
</script>

<template>
  <BasePanel
    title="Prises en charge médicales"
    subtitle="Soins, pharmacie, optique, hospitalisation, évacuation (art. 122–127)"
  >
    <BaseDataState :pending="pending" :error="error">
      <BaseTable
        :data="rows"
        :columns="columns"
        searchable
        search-placeholder="Rechercher un agent…"
        :page-size="10"
        :row-to="(p) => `/affaires-sociales/prises-en-charge/${p.id}`"
      >
        <template #filters>
          <USelect v-model="statut" :items="statutItems" class="w-48" />
          <USelect v-model="type" :items="typeItems" class="w-56" />
        </template>
        <template #actions>
          <UButton v-if="acteur.peutGerer" icon="i-lucide-plus" @click="ouvrir">
            Nouvelle prise en charge
          </UButton>
        </template>
        <template #empty>
          <p class="py-6 text-center text-sm text-muted">Aucune prise en charge</p>
        </template>

        <template #type-cell="{ row }">
          <div class="flex items-center gap-2">
            <div>
              <p class="text-sm text-highlighted">
                {{ row!.original.type_label ?? (row!.original.type ? TYPE_PRISE_EN_CHARGE_LABEL[row!.original.type] : "—") }}
              </p>
              <p class="text-xs text-muted">
                {{ row!.original.article_ccn ?? (row!.original.type ? ARTICLE_PRISE_EN_CHARGE[row!.original.type] : "") }}
              </p>
            </div>
            <UBadge
              v-if="row!.original.at_mp"
              color="warning"
              variant="subtle"
              size="sm"
              title="Soins consécutifs à un accident du travail ou une maladie professionnelle"
            >
              AT/MP
            </UBadge>
          </div>
        </template>

        <template #montant-cell="{ row }">
          <span class="text-sm tabular-nums">
            {{ formatMontant(row!.original.montant_facture) }}
            <span class="text-muted"> / </span>
            {{ formatMontant(row!.original.montant_accorde) }}
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

    <UModal v-model:open="open" title="Nouvelle prise en charge">
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

          <UFormField
            label="Bénéficiaire des soins"
            name="ayant_droit_id"
            :help="agentId ? 'À laisser vide si les soins concernent l\'agent lui-même.' : 'Choisissez d\'abord un agent.'"
          >
            <USelectMenu
              v-model="ayantDroitId"
              :items="ayantDroitOptions"
              value-key="value"
              :disabled="!agentId"
              placeholder="L'agent lui-même"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Nature des frais" name="type" required>
            <USelectMenu
              v-model="typeChoisi"
              :items="TYPES_PRISE_EN_CHARGE.map((t) => ({ label: `${TYPE_PRISE_EN_CHARGE_LABEL[t]} — ${ARTICLE_PRISE_EN_CHARGE[t]}`, value: t }))"
              value-key="value"
              class="w-full"
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Date des soins" name="date_soins" required>
              <UInput v-model="dateSoins" type="date" class="w-full" />
            </UFormField>
            <UFormField label="Montant facturé" name="montant_facture">
              <UInput v-model.number="montantFacture" type="number" min="1" class="w-full" />
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

          <!-- Un séjour a une durée ; des soins ponctuels n'en ont pas. -->
          <div v-if="avecSejour" class="grid grid-cols-2 gap-4">
            <UFormField label="Début du séjour" name="date_debut">
              <UInput v-model="dateDebut" type="date" class="w-full" />
            </UFormField>
            <UFormField label="Fin du séjour" name="date_fin">
              <UInput v-model="dateFin" type="date" class="w-full" />
            </UFormField>
          </div>

          <UFormField
            label="Lieu"
            name="lieu"
            help="Utile pour une évacuation sanitaire : ville ou pays de destination."
          >
            <UInput v-model="lieu" class="w-full" />
          </UFormField>

          <UCheckbox
            v-model="atMp"
            label="Consécutif à un accident du travail ou une maladie professionnelle"
          />

          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
            <UButton :loading="busy" @click="enregistrer">Créer le brouillon</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </BasePanel>
</template>
