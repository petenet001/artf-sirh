<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { InscriptionFormation } from "~/schemas/inscription-formation";
import { STATUTS_INSCRIPTION_FORMATION } from "~/constants/enums";
import { agentNom, exigeRapport, STATUT_INSCRIPTION_LABEL } from "~/constants/formations";

/**
 * Inscriptions aux formations. Parcours : `inscrite` → présence confirmée →
 * terminée ; ou annulée.
 *
 * Deux règles de la CCN se voient à l'écran : la clôture d'un perfectionnement
 * ou d'une qualification exige le rapport de fin de formation (art. 100), et
 * l'`admission_sur_titre` (art. 103) suppose un âge ≤ 50 ans et le dernier
 * échelon — l'API tranche, on affiche son 422.
 */
const api = useFormationsApi();
const auth = useAuthStore();
const toast = useToast();
const handleError = useApiError();

const peutGerer = computed(() => auth.can("gerer-formations"));

const filters = reactive<Record<string, string | number | undefined>>({});
const { data, pending, error, refresh } = useAsyncData(
  "inscriptions-formation",
  () => api.inscriptions({ ...filters }),
  { watch: [filters] },
);
const inscriptions = computed(() => data.value?.data ?? []);

const ALL = "__all__";
const statutItems = [
  { label: "Tous les statuts", value: ALL },
  ...STATUTS_INSCRIPTION_FORMATION.map((s) => ({ label: STATUT_INSCRIPTION_LABEL[s], value: s })),
];
const statut = ref<string>(ALL);
watch(statut, (v) => (v === ALL ? delete filters.statut : (filters.statut = v)));

// — Inscription ————————————————————————————————————————————————
const { options: agentOptions } = useResourceOptions("inscription-agents", () => useAgentsApi().list(), (a) =>
  agentNom(a),
);
const { data: catalogueData } = useAsyncData("inscription-catalogue", () => api.catalogue({ actif: true }));
const formations = computed(() => catalogueData.value?.data ?? []);
const formationOptions = computed(() => formations.value.map((f) => ({ label: f.titre, value: f.id })));

const { data: plansData } = useAsyncData("inscription-plans", () => api.plans());
const planOptions = computed(() =>
  (plansData.value?.data ?? [])
    .filter((p) => p.statut === "valide" || p.statut === "execute")
    .map((p) => ({ label: `Plan ${p.annee}`, value: p.id })),
);

const open = ref(false);
const busy = ref(false);
const agentId = ref<number | undefined>(undefined);
const formationId = ref<number | undefined>(undefined);
const planId = ref<number | undefined>(undefined);
const dateDebut = ref<string | undefined>(undefined);
const dateFin = ref<string | undefined>(undefined);
const admissionSurTitre = ref(false);

function ouvrir() {
  agentId.value = undefined;
  formationId.value = undefined;
  planId.value = undefined;
  dateDebut.value = undefined;
  dateFin.value = undefined;
  admissionSurTitre.value = false;
  open.value = true;
}

async function executer(fn: () => Promise<unknown>, message: string) {
  busy.value = true;
  try {
    await fn();
    toast.add({ title: message, color: "success" });
    open.value = false;
    clotureOpen.value = false;
    await refresh();
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

function inscrire() {
  if (!agentId.value || !formationId.value) {
    toast.add({ title: "Agent et formation sont requis.", color: "error" });
    return;
  }
  executer(
    () =>
      api.inscrire({
        agent_id: agentId.value!,
        formation_id: formationId.value!,
        plan_id: planId.value ?? null,
        date_debut: dateDebut.value || null,
        date_fin: dateFin.value || null,
        admission_sur_titre: admissionSurTitre.value,
      }),
    "Agent inscrit à la formation",
  );
}

// — Clôture ————————————————————————————————————————————————————
const clotureOpen = ref(false);
const courante = ref<InscriptionFormation | null>(null);
const rapportRemis = ref(false);
const dateFinCloture = ref<string | undefined>(undefined);
const rapportAttendu = computed(() => exigeRapport(courante.value?.formation?.type_action));

function ouvrirCloture(inscription: InscriptionFormation) {
  courante.value = inscription;
  rapportRemis.value = inscription.rapport_remis ?? false;
  dateFinCloture.value = inscription.date_fin ?? undefined;
  clotureOpen.value = true;
}

function cloturer() {
  if (!courante.value) return;
  executer(
    () =>
      api.cloturerInscription(courante.value!.id, {
        rapport_remis: rapportRemis.value,
        date_fin: dateFinCloture.value || null,
      }),
    "Inscription clôturée",
  );
}

function confirmerPresence(inscription: InscriptionFormation) {
  executer(() => api.confirmerPresence(inscription.id), "Présence confirmée");
}

function annuler(inscription: InscriptionFormation) {
  if (!confirm("Annuler cette inscription ?")) return;
  executer(() => api.annulerInscription(inscription.id), "Inscription annulée");
}

const columns: TableColumn<InscriptionFormation>[] = [
  {
    id: "agent",
    header: "Agent",
    accessorFn: (i) => agentNom(i.agent),
    cell: ({ row }) => agentNom(row.original.agent),
  },
  { id: "formation", header: "Formation" },
  { id: "periode", header: "Période" },
  { id: "statut", header: "Statut" },
  { id: "actions", header: "" },
];
</script>

<template>
  <BasePanel title="Inscriptions" subtitle="Participation des agents aux actions de formation">
    <BaseDataState :pending="pending" :error="error">
      <BaseTable
        :data="inscriptions"
        :columns="columns"
        searchable
        search-placeholder="Rechercher un agent…"
        :page-size="10"
      >
        <template #filters>
          <USelect v-model="statut" :items="statutItems" class="w-48" />
        </template>
        <template #actions>
          <UButton v-if="peutGerer" icon="i-lucide-plus" @click="ouvrir">Nouvelle inscription</UButton>
        </template>
        <template #empty>
          <p class="py-6 text-center text-sm text-muted">Aucune inscription</p>
        </template>
        <template #formation-cell="{ row }">
          <div class="min-w-0">
            <p class="truncate text-sm text-highlighted">{{ row!.original.formation?.titre ?? "—" }}</p>
            <p v-if="row!.original.debit_jusqu_au" class="text-xs text-muted">
              Engagement de service jusqu'au {{ formatDate(row!.original.debit_jusqu_au) }}
            </p>
          </div>
        </template>
        <template #periode-cell="{ row }">
          <span class="text-sm text-muted">
            {{ formatPeriode(row!.original.date_debut, row!.original.date_fin) }}
          </span>
        </template>
        <template #statut-cell="{ row }">
          <div class="flex items-center gap-2">
            <FormationsStatutInscriptionBadge :statut="row!.original.statut" :label="row!.original.statut_label" />
            <UBadge v-if="row!.original.admission_sur_titre" color="primary" variant="outline" size="sm">
              Admission sur titre
            </UBadge>
          </div>
        </template>
        <template #actions-cell="{ row }">
          <div v-if="peutGerer" class="flex justify-end gap-2">
            <UButton
              v-if="row!.original.statut === 'inscrite'"
              size="xs"
              color="neutral"
              variant="soft"
              icon="i-lucide-user-check"
              :loading="busy"
              @click="confirmerPresence(row!.original)"
            >
              Présence
            </UButton>
            <UButton
              v-if="row!.original.statut === 'presente'"
              size="xs"
              variant="soft"
              icon="i-lucide-flag"
              :loading="busy"
              @click="ouvrirCloture(row!.original)"
            >
              Clôturer
            </UButton>
            <UButton
              v-if="['inscrite', 'presente'].includes(row!.original.statut ?? '')"
              size="xs"
              color="error"
              variant="ghost"
              icon="i-lucide-x"
              :loading="busy"
              @click="annuler(row!.original)"
            />
          </div>
        </template>
      </BaseTable>
    </BaseDataState>

    <UModal v-model:open="open" title="Inscrire un agent">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Agent" name="agent_id" required>
            <USelectMenu v-model="agentId" :items="agentOptions" value-key="value" placeholder="Sélectionner un agent" class="w-full" />
          </UFormField>
          <UFormField label="Formation" name="formation_id" required>
            <USelectMenu v-model="formationId" :items="formationOptions" value-key="value" class="w-full" />
          </UFormField>
          <UFormField label="Plan annuel" name="plan_id" help="Seuls les plans validés ou en exécution sont proposés.">
            <USelect v-model="planId" :items="planOptions" value-key="value" class="w-full" />
          </UFormField>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Du" name="date_debut">
              <UInput v-model="dateDebut" type="date" class="w-full" />
            </UFormField>
            <UFormField label="Au" name="date_fin">
              <UInput v-model="dateFin" type="date" class="w-full" />
            </UFormField>
          </div>
          <UFormField name="admission_sur_titre">
            <USwitch
              v-model="admissionSurTitre"
              label="Admission sur titre (art. 103)"
              description="Réservée aux agents de 50 ans au plus, au dernier échelon."
            />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
            <UButton :loading="busy" @click="inscrire">Inscrire</UButton>
          </div>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="clotureOpen" title="Clôturer l'inscription">
      <template #body>
        <div class="space-y-4">
          <UAlert
            v-if="rapportAttendu"
            color="warning"
            variant="subtle"
            icon="i-lucide-file-text"
            title="Rapport de fin de formation requis"
            description="Un perfectionnement ou une qualification ne se clôture qu'avec le rapport (art. 100)."
          />
          <UFormField label="Date de fin" name="date_fin">
            <UInput v-model="dateFinCloture" type="date" class="w-full" />
          </UFormField>
          <UFormField name="rapport_remis">
            <USwitch v-model="rapportRemis" label="Rapport de fin de formation remis" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="clotureOpen = false">Annuler</UButton>
            <UButton :loading="busy" @click="cloturer">Clôturer</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </BasePanel>
</template>
