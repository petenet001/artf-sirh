<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { CertificationFormation } from "~/schemas/certification-formation";
import { agentNom } from "~/constants/formations";

/**
 * Certifications obtenues à l'issue des formations. Le lien `diplome_id` ouvre
 * la porte du reclassement après formation (art. 73) : c'est le même
 * référentiel de diplômes.
 */
const api = useFormationsApi();
const auth = useAuthStore();
const toast = useToast();
const handleError = useApiError();

const peutGerer = computed(() => auth.can("gerer-formations"));

const { data, pending, error, refresh } = useAsyncData("certifications-formation", () =>
  api.certifications(),
);
const certifications = computed(() => data.value?.data ?? []);

const { options: agentOptions } = useResourceOptions("certification-agents", () => useAgentsApi().list(), (a) =>
  agentNom(a),
);
const { data: catalogueData } = useAsyncData("certification-catalogue", () => api.catalogue());
const formationOptions = computed(() =>
  (catalogueData.value?.data ?? []).map((f) => ({ label: f.titre, value: f.id })),
);
const { options: diplomeOptions } = useResourceOptions("certification-diplomes", () => useDiplomesApi().list());

const open = ref(false);
const busy = ref(false);
const agentId = ref<number | undefined>(undefined);
const formationId = ref<number | undefined>(undefined);
const diplomeId = ref<number | undefined>(undefined);
const dateObtention = ref<string | undefined>(undefined);
const reference = ref("");
const fichier = ref<File | null>(null);

function ouvrir() {
  agentId.value = undefined;
  formationId.value = undefined;
  diplomeId.value = undefined;
  dateObtention.value = undefined;
  reference.value = "";
  fichier.value = null;
  open.value = true;
}

async function enregistrer() {
  if (!agentId.value || !formationId.value || !dateObtention.value) {
    toast.add({ title: "Agent, formation et date d'obtention sont requis.", color: "error" });
    return;
  }
  busy.value = true;
  try {
    await api.creerCertification(
      {
        agent_id: agentId.value,
        formation_id: formationId.value,
        diplome_id: diplomeId.value ?? null,
        date_obtention: dateObtention.value,
        reference: reference.value.trim() || null,
      },
      fichier.value,
    );
    toast.add({ title: "Certification enregistrée", color: "success" });
    open.value = false;
    await refresh();
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

async function telecharger(certification: CertificationFormation) {
  busy.value = true;
  try {
    downloadBlob(
      await api.fichierCertification(certification.id),
      certification.nom_original ?? `certification-${certification.id}.pdf`,
    );
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

async function supprimer(certification: CertificationFormation) {
  if (!confirm("Supprimer cette certification ?")) return;
  try {
    await api.supprimerCertification(certification.id);
    await refresh();
  } catch (err) {
    handleError(err);
  }
}

const columns: TableColumn<CertificationFormation>[] = [
  {
    id: "agent",
    header: "Agent",
    accessorFn: (c) => agentNom(c.agent),
    cell: ({ row }) => agentNom(row.original.agent),
  },
  { id: "formation", header: "Formation" },
  { id: "diplome", header: "Diplôme" },
  {
    id: "obtention",
    header: "Obtenue le",
    cell: ({ row }) => formatDate(row.original.date_obtention),
  },
  { id: "actions", header: "" },
];
</script>

<template>
  <BasePanel title="Certifications" subtitle="Titres obtenus à l'issue des formations">
    <BaseDataState :pending="pending" :error="error">
      <BaseTable
        :data="certifications"
        :columns="columns"
        searchable
        search-placeholder="Rechercher un agent…"
        :page-size="10"
      >
        <template #actions>
          <UButton v-if="peutGerer" icon="i-lucide-plus" @click="ouvrir">Nouvelle certification</UButton>
        </template>
        <template #empty>
          <p class="py-6 text-center text-sm text-muted">Aucune certification</p>
        </template>
        <template #formation-cell="{ row }">
          <span class="text-sm">{{ row!.original.formation?.titre ?? "—" }}</span>
        </template>
        <template #diplome-cell="{ row }">
          <span class="text-sm text-muted">{{ row!.original.diplome?.nom ?? "—" }}</span>
        </template>
        <template #actions-cell="{ row }">
          <div class="flex justify-end gap-1">
            <UButton
              v-if="row!.original.has_fichier"
              size="xs"
              color="neutral"
              variant="ghost"
              icon="i-lucide-download"
              :loading="busy"
              @click="telecharger(row!.original)"
            />
            <UButton
              v-if="peutGerer"
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

    <UModal v-model:open="open" title="Enregistrer une certification">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Agent" name="agent_id" required>
            <USelectMenu v-model="agentId" :items="agentOptions" value-key="value" placeholder="Sélectionner un agent" class="w-full" />
          </UFormField>
          <UFormField label="Formation" name="formation_id" required>
            <USelectMenu v-model="formationId" :items="formationOptions" value-key="value" class="w-full" />
          </UFormField>
          <UFormField
            label="Diplôme correspondant"
            name="diplome_id"
            help="Facultatif — ouvre un reclassement après formation (art. 73)."
          >
            <USelectMenu v-model="diplomeId" :items="diplomeOptions" value-key="value" class="w-full" />
          </UFormField>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Date d'obtention" name="date_obtention" required>
              <UInput v-model="dateObtention" type="date" class="w-full" />
            </UFormField>
            <UFormField label="Référence" name="reference">
              <UInput v-model="reference" class="w-full" />
            </UFormField>
          </div>
          <BaseUploadZone
            v-model="fichier"
            label="Justificatif (facultatif)"
            accept="PDF, JPEG, PNG — 10 Mo max."
            accept-attr=".pdf,.jpg,.jpeg,.png"
          />
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
            <UButton :loading="busy" @click="enregistrer">Enregistrer</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </BasePanel>
</template>
