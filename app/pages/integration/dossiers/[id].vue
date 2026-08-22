<script setup lang="ts">
import {
  PRIMARY_ACTION,
  STATUT_HINT,
  TERMINAL_STATUTS,
  progressOf,
  type DossierStatut,
} from "~/constants/integration-workflow";

const route = useRoute();
const id = computed(() => Number(route.params.id));

const dossiersApi = useDossiersApi();
const toast = useToast();
const handleError = useApiError();

const { data, pending, error, refresh } = useAsyncData(
  () => `dossier-${id.value}`,
  () => dossiersApi.getById(id.value),
  { watch: [id] },
);
const dossier = computed(() => data.value?.data ?? null);
const statut = computed(() => (dossier.value?.statut ?? undefined) as DossierStatut | undefined);
const agentId = computed(() => dossier.value?.agent_id ?? dossier.value?.agent?.id);
const primary = computed(() => (statut.value ? PRIMARY_ACTION[statut.value] : undefined));
const hint = computed(() => (statut.value ? STATUT_HINT[statut.value] : undefined));
const isTerminal = computed(() => (statut.value ? TERMINAL_STATUTS.includes(statut.value) : false));
const progressPct = computed(() => (statut.value ? Math.round(progressOf(statut.value) * 100) : 0));

// Force le rechargement des panneaux enfants après une action.
const refreshKey = ref(0);
async function refreshAll() {
  await refresh();
  refreshKey.value++;
}

const busy = ref(false);
async function runTransition(fn: () => Promise<unknown>, successMsg: string) {
  busy.value = true;
  try {
    await fn();
    toast.add({ title: successMsg, color: "success" });
    await refreshAll();
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

// Modales d'action
const matriculeOpen = ref(false);
const affecterOpen = ref(false);
const nommerOpen = ref(false);
const compteOpen = ref(false);
const priseOpen = ref(false);
const materielOpen = ref(false);

async function genererActe() {
  busy.value = true;
  try {
    const res = await dossiersApi.genererActe(id.value);
    toast.add({ title: "Acte généré", description: res.message, color: "success", icon: "i-lucide-stamp" });
    await refreshAll();
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

function runPrimary() {
  switch (primary.value?.key) {
    case "soumettre": return runTransition(() => dossiersApi.soumettre(id.value), "Dossier soumis pour étude RH");
    case "passerEnEtudeRH": return runTransition(() => dossiersApi.passerEnEtudeRH(id.value), "Dossier pris en charge par les RH");
    case "marquerComplet": return runTransition(() => dossiersApi.marquerComplet(id.value), "Dossier marqué complet");
    case "validerRH": return runTransition(() => dossiersApi.validerRH(id.value), "Dossier validé RH — circuit lancé");
    case "genererActe": return genererActe();
    case "marquerContratSigne": return runTransition(() => dossiersApi.marquerContratSigne(id.value), "Contrat marqué signé");
    case "assignerMatricule": matriculeOpen.value = true; return;
    case "affecter": affecterOpen.value = true; return;
    case "creerCompte": compteOpen.value = true; return;
    case "priseService": priseOpen.value = true; return;
    case "integrer": return runTransition(() => dossiersApi.integrer(id.value), "Intégration finalisée");
  }
}

// Actions négatives (commentaire)
const dangerOpen = ref(false);
const dangerKind = ref<"rejeter" | "suspendre" | "annuler">("rejeter");
const dangerComment = ref("");
const dangerLabel = { rejeter: "Rejeter le dossier", suspendre: "Suspendre le dossier", annuler: "Annuler le dossier" };
function openDanger(kind: "rejeter" | "suspendre" | "annuler") {
  dangerKind.value = kind;
  dangerComment.value = "";
  dangerOpen.value = true;
}
async function confirmDanger() {
  const payload = { commentaire: dangerComment.value || undefined };
  const fn =
    dangerKind.value === "rejeter"
      ? () => dossiersApi.rejeterRH(id.value, payload)
      : dangerKind.value === "suspendre"
        ? () => dossiersApi.suspendre(id.value, payload)
        : () => dossiersApi.annuler(id.value, payload);
  dangerOpen.value = false;
  await runTransition(fn, dangerLabel[dangerKind.value]);
}

// Actions optionnelles selon le statut
const canNommer = computed(() => statut.value === "AFFECTE" || statut.value === "NOMME");
const canMateriel = computed(() => ["AFFECTE", "NOMME", "COMPTE_CREE"].includes(statut.value ?? ""));

const moreActions = computed(() => {
  const items: { label: string; icon: string; color?: "error"; onSelect: () => void }[] = [];
  if (canNommer.value) items.push({ label: "Nommer l'agent", icon: "i-lucide-crown", onSelect: () => (nommerOpen.value = true) });
  if (canMateriel.value) items.push({ label: "Remettre du matériel", icon: "i-lucide-package", onSelect: () => (materielOpen.value = true) });
  if (!isTerminal.value) {
    items.push({ label: "Renvoyer / Suspendre", icon: "i-lucide-pause", onSelect: () => openDanger("suspendre") });
    items.push({ label: "Rejeter", icon: "i-lucide-x-circle", color: "error", onSelect: () => openDanger("rejeter") });
    items.push({ label: "Annuler le dossier", icon: "i-lucide-ban", color: "error", onSelect: () => openDanger("annuler") });
  }
  return [items];
});

const tabs = [
  { label: "Vue d'ensemble", icon: "i-lucide-layout-list", value: "apercu" },
  { label: "Pièces", icon: "i-lucide-paperclip", value: "pieces" },
  { label: "Circuit", icon: "i-lucide-git-merge", value: "circuit" },
  { label: "Actes", icon: "i-lucide-stamp", value: "actes" },
  { label: "Historique", icon: "i-lucide-history", value: "historique" },
];
const tab = ref("apercu");
</script>

<template>
  <BasePanel :title="dossier?.reference ?? 'Dossier d\'intégration'" subtitle="Intégration administrative">
    <template #actions>
      <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" to="/integration/dossiers">Retour</UButton>
    </template>

    <BaseDataState :pending="pending" :error="error" :empty="!dossier" empty-label="Dossier introuvable">
      <div v-if="dossier" class="space-y-6">
        <!-- Bandeau statut + progression + action principale -->
        <UCard>
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <IntegrationStatutBadge :statut="statut" :label="dossier.statut_label" />
                <span class="text-sm text-muted">{{ dossier.agent?.nom_complet ?? "Agent" }}</span>
              </div>
              <p v-if="hint" class="text-sm text-muted">{{ hint }}</p>
              <div class="flex items-center gap-2 pt-1">
                <div class="h-1.5 w-40 overflow-hidden rounded-full bg-elevated">
                  <div class="h-full rounded-full bg-primary" :style="{ width: `${progressPct}%` }" />
                </div>
                <span class="text-xs text-muted">{{ progressPct }}%</span>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <UButton
                v-if="primary && !isTerminal"
                :icon="primary.icon"
                :loading="busy"
                size="lg"
                @click="runPrimary"
              >
                {{ primary.label }}
              </UButton>
              <UBadge v-else-if="isTerminal" :color="statut === 'INTEGRE' ? 'success' : 'neutral'" variant="subtle" size="lg">
                Dossier {{ statut === 'INTEGRE' ? 'finalisé' : 'clôturé' }}
              </UBadge>
              <UDropdownMenu v-if="moreActions[0]?.length" :items="moreActions">
                <UButton color="neutral" variant="outline" icon="i-lucide-ellipsis-vertical" aria-label="Plus d'actions" />
              </UDropdownMenu>
            </div>
          </div>
        </UCard>

        <div class="grid gap-6 lg:grid-cols-[260px_1fr]">
          <!-- Stepper -->
          <UCard :ui="{ body: 'p-4' }">
            <IntegrationWorkflowStepper v-if="statut" :statut="statut" />
          </UCard>

          <!-- Onglets -->
          <div>
            <UTabs v-model="tab" :items="tabs" class="mb-4" />

            <div v-show="tab === 'apercu'">
              <UCard>
                <dl class="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  <BaseDefItem label="Référence" :value="dossier.reference" />
                  <BaseDefItem label="Type d'intégration" :value="dossier.type_integration?.nom" />
                  <BaseDefItem label="Agent" :value="dossier.agent?.nom_complet" />
                  <BaseDefItem label="Matricule" :value="dossier.agent?.matricule" />
                  <BaseDefItem label="Poste demandé" :value="dossier.poste_demande" />
                  <BaseDefItem label="Date de demande" :value="formatDateLong(dossier.date_demande)" />
                  <BaseDefItem label="Demandeur" :value="dossier.demandeur?.name" />
                  <BaseDefItem label="Nombre de postes" :value="dossier.nombre_postes" />
                </dl>
                <template #footer>
                  <UButton
                    v-if="agentId"
                    variant="link"
                    :padded="false"
                    trailing-icon="i-lucide-arrow-right"
                    :to="`/personnel/agents/${agentId}`"
                  >
                    Ouvrir la fiche agent
                  </UButton>
                </template>
              </UCard>
            </div>

            <div v-show="tab === 'pieces'">
              <IntegrationDocumentsPanel :key="`d${refreshKey}`" :dossier-id="id" />
            </div>
            <div v-show="tab === 'circuit'">
              <IntegrationCircuitPanel :key="`c${refreshKey}`" :dossier-id="id" @changed="refreshAll" />
            </div>
            <div v-show="tab === 'actes'">
              <IntegrationActesPanel :key="`a${refreshKey}`" :dossier-id="id" />
            </div>
            <div v-show="tab === 'historique'">
              <IntegrationHistoriquePanel :key="`h${refreshKey}`" :dossier-id="id" />
            </div>
          </div>
        </div>
      </div>
    </BaseDataState>

    <!-- Modales -->
    <IntegrationMatriculeModal v-model:open="matriculeOpen" :dossier-id="id" @done="refreshAll" />
    <IntegrationCompteModal v-if="agentId" v-model:open="compteOpen" :dossier-id="id" :agent-id="agentId" @done="refreshAll" />
    <IntegrationAffectationModal v-if="agentId" v-model:open="affecterOpen" :dossier-id="id" :agent-id="agentId" @done="refreshAll" />
    <IntegrationNominationModal v-if="agentId" v-model:open="nommerOpen" :dossier-id="id" :agent-id="agentId" @done="refreshAll" />
    <IntegrationPriseServiceModal v-if="agentId" v-model:open="priseOpen" :dossier-id="id" :agent-id="agentId" @done="refreshAll" />
    <IntegrationMaterielModal v-if="agentId" v-model:open="materielOpen" :agent-id="agentId" @done="refreshAll" />

    <!-- Action négative -->
    <UModal v-model:open="dangerOpen" :title="dangerLabel[dangerKind]">
      <template #title>
        <BaseCardTitle icon="i-lucide-triangle-alert" :title="dangerLabel[dangerKind]" />
      </template>
      <template #body>
        <div class="space-y-4">
          <UFormField label="Commentaire" :required="dangerKind === 'rejeter'">
            <UTextarea v-model="dangerComment" :rows="3" class="w-full" placeholder="Motif…" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="dangerOpen = false">Annuler</UButton>
            <UButton color="error" :loading="busy" @click="confirmDanger">Confirmer</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </BasePanel>
</template>
