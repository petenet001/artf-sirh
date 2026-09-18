<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { ArretSante, ArretSanteInput } from "~/schemas/arret-sante";
import { STATUTS_DOSSIER_SOCIAL, NATURES_ARRET_SANTE } from "~/constants/enums";
import {
  agentNom,
  NATURE_ARRET_LABEL,
  origineProfessionnelle,
  STATUT_DOSSIER_SOCIAL_COLOR,
  STATUT_DOSSIER_SOCIAL_LABEL,
  type NatureArretSante,
} from "~/constants/dossiers-sociaux";

/**
 * Arrêts de santé (art. 132–135) : maladie, accident du travail, maladie
 * professionnelle, accident non professionnel.
 *
 * La **nature** n'est pas un simple libellé : elle décide des droits. Un
 * accident du travail ouvre une indemnisation plus longue qu'une maladie
 * ordinaire, d'où le repère visuel sur les arrêts d'origine professionnelle.
 */
const api = useArretsSanteApi();
const acteur = useActeurDossierSocial();
const toast = useToast();
const handleError = useApiError();

const { data, pending, error } = useAsyncData("arrets-sante", () => api.list());
const arrets = computed(() => data.value?.data ?? []);

const ALL = "__all__";
const statutItems = [
  { label: "Tous les statuts", value: ALL },
  ...STATUTS_DOSSIER_SOCIAL.map((s) => ({ label: STATUT_DOSSIER_SOCIAL_LABEL[s], value: s })),
];
const natureItems = [
  { label: "Toutes les natures", value: ALL },
  ...NATURES_ARRET_SANTE.map((n) => ({ label: NATURE_ARRET_LABEL[n], value: n })),
];
const statut = ref<string>(ALL);
const nature = ref<string>(ALL);

const rows = computed(() =>
  arrets.value.filter(
    (a) =>
      (statut.value === ALL || a.statut === statut.value) &&
      (nature.value === ALL || a.nature === nature.value),
  ),
);

// ── Création ────────────────────────────────────────────────────────────────

const open = ref(false);
const busy = ref(false);

// État du formulaire (sans `null` : les contrôles de saisie veulent `undefined`).
const agentId = ref<number | undefined>(undefined);
const natureChoisie = ref<NatureArretSante | undefined>(undefined);
const dateFait = ref<string | undefined>(undefined);
const dateNotification = ref<string | undefined>(undefined);
const dateDebut = ref<string | undefined>(undefined);
const dateFin = ref<string | undefined>(undefined);
const structureId = ref<number | undefined>(undefined);

const { options: agentOptions } = useResourceOptions(
  "arret-agents",
  () => useAgentsApi().list(),
  (a) => agentNom(a),
);
const { options: structureOptions } = useResourceOptions("arret-structures", () =>
  useStructuresSanitairesApi().list({ actif: true }),
);

function ouvrir() {
  agentId.value = undefined;
  natureChoisie.value = undefined;
  dateFait.value = undefined;
  dateNotification.value = undefined;
  dateDebut.value = undefined;
  dateFin.value = undefined;
  structureId.value = undefined;
  open.value = true;
}

async function enregistrer() {
  if (!agentId.value || !natureChoisie.value || !dateFait.value || !dateDebut.value || !structureId.value) {
    toast.add({
      title: "Agent, nature, dates et structure sanitaire sont requis.",
      color: "error",
    });
    return;
  }
  busy.value = true;
  try {
    const payload: ArretSanteInput = {
      agent_id: agentId.value,
      nature: natureChoisie.value,
      date_fait: dateFait.value,
      date_notification: dateNotification.value ?? null,
      date_debut: dateDebut.value,
      date_fin: dateFin.value ?? null,
      structure_sanitaire_id: structureId.value,
    };
    const { data: cree } = await api.create(payload);
    toast.add({ title: "Arrêt créé en brouillon", color: "success" });
    open.value = false;
    await navigateTo(`/affaires-sociales/arrets/${cree.id}`);
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

const columns: TableColumn<ArretSante>[] = [
  {
    id: "agent",
    header: "Agent",
    accessorFn: (a) => agentNom(a.agent),
    cell: ({ row }) => agentNom(row.original.agent),
  },
  { id: "nature", header: "Nature" },
  { id: "periode", header: "Période" },
  { id: "duree", header: "Indemnisation" },
  { id: "statut", header: "Statut" },
];
</script>

<template>
  <BasePanel title="Arrêts de santé" subtitle="Maladie, accident du travail, maladie professionnelle (art. 132–135)">
    <BaseDataState :pending="pending" :error="error">
      <BaseTable
        :data="rows"
        :columns="columns"
        searchable
        search-placeholder="Rechercher un agent…"
        :page-size="10"
        :row-to="(a) => `/affaires-sociales/arrets/${a.id}`"
      >
        <template #filters>
          <USelect v-model="statut" :items="statutItems" class="w-48" />
          <USelect v-model="nature" :items="natureItems" class="w-56" />
        </template>
        <template #actions>
          <UButton v-if="acteur.peutGerer" icon="i-lucide-plus" @click="ouvrir">Nouvel arrêt</UButton>
        </template>
        <template #empty>
          <p class="py-6 text-center text-sm text-muted">Aucun arrêt</p>
        </template>

        <template #nature-cell="{ row }">
          <div class="flex items-center gap-2">
            <span class="text-sm text-highlighted">
              {{ row!.original.nature_label ?? (row!.original.nature ? NATURE_ARRET_LABEL[row!.original.nature] : "—") }}
            </span>
            <UBadge
              v-if="origineProfessionnelle(row!.original.nature)"
              color="warning"
              variant="subtle"
              size="sm"
              title="Origine professionnelle : indemnisation élargie (art. 133)"
            >
              Professionnelle
            </UBadge>
          </div>
        </template>

        <template #periode-cell="{ row }">
          <span class="text-sm">
            {{ formatDate(row!.original.date_debut) }}
            <template v-if="row!.original.date_fin"> → {{ formatDate(row!.original.date_fin) }}</template>
            <span v-else class="text-muted"> → en cours</span>
          </span>
        </template>

        <template #duree-cell="{ row }">
          <span v-if="row!.original.nb_mois" class="text-sm tabular-nums">
            {{ row!.original.nb_mois }} mois plein
            <template v-if="row!.original.nb_mois_majoration">
              + {{ row!.original.nb_mois_majoration }} demi
            </template>
          </span>
          <span v-else class="text-sm text-muted">—</span>
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

    <UModal v-model:open="open" title="Nouvel arrêt de santé">
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
            label="Nature de l'arrêt"
            name="nature"
            required
            help="Elle détermine la durée d'indemnisation : un accident du travail ouvre plus de droits qu'une maladie."
          >
            <USelectMenu
              v-model="natureChoisie"
              :items="NATURES_ARRET_SANTE.map((n) => ({ label: NATURE_ARRET_LABEL[n], value: n }))"
              value-key="value"
              class="w-full"
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Date du fait" name="date_fait" required help="Accident, ou constat de la maladie.">
              <UInput v-model="dateFait" type="date" class="w-full" />
            </UFormField>
            <UFormField label="Notifié le" name="date_notification" help="Quand l'employeur a été prévenu.">
              <UInput v-model="dateNotification" type="date" class="w-full" />
            </UFormField>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Début de l'arrêt" name="date_debut" required>
              <UInput v-model="dateDebut" type="date" class="w-full" />
            </UFormField>
            <UFormField label="Fin de l'arrêt" name="date_fin" help="À laisser vide si l'arrêt court encore.">
              <UInput v-model="dateFin" type="date" class="w-full" />
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

          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
            <UButton :loading="busy" @click="enregistrer">Créer le brouillon</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </BasePanel>
</template>
