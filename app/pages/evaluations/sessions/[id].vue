<script setup lang="ts">
import { agentNom, STATUT_EVALUATION_LABEL, type StatutEvaluation } from "~/constants/evaluations";

/**
 * Détail d'une session : pilotage RH du cycle (fiches générées, compteurs,
 * agents restés sans notateur, clôture) et accès aux fiches.
 *
 * ⚠️ « Agents sans N+1 » n'est pas une anomalie de la session mais d'affectation
 * (art. 62 : le notateur est le chef du poste dominant des 24 derniers mois) :
 * on corrige l'affectation, puis on regénère les fiches manquantes.
 */
const route = useRoute();
const id = computed(() => Number(route.params.id));

const api = useSessionsEvaluationApi();
const evaluationsApi = useEvaluationsApi();
const auth = useAuthStore();
const toast = useToast();
const handleError = useApiError();

const peutCreer = computed(() => auth.can("creer-evaluations"));

const { data, pending, error, refresh } = useAsyncData(
  () => `session-evaluation-${id.value}`,
  () => (id.value > 0 ? api.getById(id.value) : Promise.resolve(null)),
  { watch: [id] },
);
const session = computed(() => data.value?.data ?? null);

const { data: statsData, refresh: refreshStats } = useAsyncData(
  () => `session-evaluation-stats-${id.value}`,
  () => (id.value > 0 ? api.stats(id.value) : Promise.resolve(null)),
  { watch: [id] },
);
const stats = computed(() => statsData.value?.data ?? null);

const { data: fichesData, refresh: refreshFiches } = useAsyncData(
  () => `session-evaluation-fiches-${id.value}`,
  () => (id.value > 0 ? evaluationsApi.list({ session_id: id.value }) : Promise.resolve(null)),
  { watch: [id] },
);
const fiches = computed(() => fichesData.value?.data ?? []);

const { data: sansSuperieurData, refresh: refreshSansSuperieur } = useAsyncData(
  () => `session-evaluation-sans-superieur-${id.value}`,
  () => (id.value > 0 && peutCreer.value ? api.sansSuperieur(id.value) : Promise.resolve(null)),
  { watch: [id] },
);
const sansSuperieur = computed(() => sansSuperieurData.value?.data ?? []);

/** Répartition par statut, triée du plus nombreux au moins nombreux. */
const repartition = computed(() =>
  Object.entries(stats.value?.par_statut ?? {})
    .map(([statut, nb]) => ({
      statut,
      nb,
      label: STATUT_EVALUATION_LABEL[statut as StatutEvaluation] ?? statut,
    }))
    .sort((a, b) => b.nb - a.nb),
);

const ouverte = computed(() => session.value?.statut === "ouverte");
const modalOpen = ref(false);
const busy = ref(false);

async function executer(fn: () => Promise<unknown>, message: string) {
  busy.value = true;
  try {
    await fn();
    toast.add({ title: message, color: "success" });
    await Promise.all([refresh(), refreshStats(), refreshFiches(), refreshSansSuperieur()]);
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

function genererFiches() {
  executer(() => api.genererFiches(id.value), "Fiches manquantes générées");
}

function cloturer() {
  if (!confirm("Clôturer la session ? Les fiches en cours ne pourront plus évoluer.")) return;
  executer(() => api.cloturer(id.value), "Session clôturée");
}

function annuler() {
  if (!confirm("Annuler la session ? Les fiches non signées seront annulées.")) return;
  executer(() => api.annuler(id.value), "Session annulée");
}
</script>

<template>
  <BasePanel title="Session d'évaluation" subtitle="Pilotage du cycle de notation">
    <template #actions>
      <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" to="/evaluations/sessions">Retour</UButton>
    </template>

    <BaseDataState :pending="pending" :error="error" :empty="!session" empty-label="Session introuvable">
      <div v-if="session" class="space-y-6">
        <!-- En-tête -->
        <div class="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-default bg-default p-5">
          <div class="min-w-0">
            <p class="text-lg font-semibold text-highlighted">
              {{ session.description ?? `Session du ${formatDate(session.debut_session)}` }}
            </p>
            <p class="text-sm text-muted">
              {{ formatPeriode(session.debut_session, session.fin_session) }}
              <span v-if="session.type_annee"> · embauche année {{ session.type_annee }}</span>
              <span v-if="session.semestre"> · {{ session.semestre === 1 ? "1ᵉʳ" : "2ᵉ" }} semestre</span>
            </p>
            <div class="mt-2">
              <EvaluationsStatutSessionBadge :statut="session.statut" :label="session.statut_label" />
            </div>
          </div>

          <div v-if="peutCreer" class="flex flex-wrap items-center justify-end gap-2">
            <UButton v-if="ouverte" color="neutral" variant="soft" icon="i-lucide-pencil" @click="modalOpen = true">
              Modifier
            </UButton>
            <UButton v-if="ouverte" color="neutral" variant="soft" icon="i-lucide-refresh-cw" :loading="busy" @click="genererFiches">
              Générer les fiches manquantes
            </UButton>
            <UButton v-if="ouverte" icon="i-lucide-lock" :loading="busy" @click="cloturer">Clôturer</UButton>
            <UButton v-if="ouverte" color="error" variant="soft" icon="i-lucide-ban" :loading="busy" @click="annuler">
              Annuler
            </UButton>
          </div>
        </div>

        <!-- Compteurs -->
        <div v-if="stats" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <BaseStatCard label="Fiches générées" :value="stats.total" icon="i-lucide-files" />
          <BaseStatCard
            label="Note moyenne"
            :value="stats.moyenne != null ? `${stats.moyenne.toLocaleString('fr-FR')}/20` : '—'"
            icon="i-lucide-gauge"
          />
          <BaseStatCard
            label="Finalisées"
            :value="stats.par_statut.finalisee ?? 0"
            icon="i-lucide-check-check"
          />
          <BaseStatCard
            label="Sans notateur"
            :value="sansSuperieur.length"
            icon="i-lucide-user-x"
            hint="Agents éligibles sans N+1 identifiable"
          />
        </div>

        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <!-- Fiches de la session -->
          <div class="rounded-xl border border-default bg-default p-5">
            <BaseCardTitle icon="i-lucide-files" title="Fiches de la session" />
            <div class="mt-4">
              <EvaluationsTable :evaluations="fiches" empty-label="Aucune fiche générée" />
            </div>
          </div>

          <div class="space-y-6">
            <!-- Répartition par statut -->
            <div class="rounded-xl border border-default bg-default p-5">
              <BaseCardTitle icon="i-lucide-pie-chart" title="Avancement" />
              <ul v-if="repartition.length" class="mt-4 space-y-2">
                <li v-for="r in repartition" :key="r.statut" class="flex items-center justify-between gap-3 text-sm">
                  <span class="truncate text-default">{{ r.label }}</span>
                  <span class="font-medium text-highlighted">{{ r.nb }}</span>
                </li>
              </ul>
              <p v-else class="mt-4 text-sm text-muted">Aucune fiche pour le moment.</p>
            </div>

            <!-- Agents sans N+1 -->
            <div v-if="peutCreer" class="rounded-xl border border-default bg-default p-5">
              <BaseCardTitle icon="i-lucide-user-x" title="Agents sans notateur" />
              <p class="mt-2 text-xs text-muted">
                Aucune fiche n'a été créée pour eux. Corrigez leur affectation, puis générez les
                fiches manquantes.
              </p>
              <ul v-if="sansSuperieur.length" class="mt-4 space-y-2">
                <li v-for="agent in sansSuperieur" :key="agent.id" class="text-sm">
                  <NuxtLink :to="`/personnel/agents/${agent.id}`" class="text-primary hover:underline">
                    {{ agentNom(agent) }}
                  </NuxtLink>
                  <span v-if="agent.matricule" class="text-muted"> · {{ agent.matricule }}</span>
                </li>
              </ul>
              <p v-else class="mt-4 text-sm text-muted">Tous les agents éligibles ont un notateur.</p>
            </div>
          </div>
        </div>
      </div>
    </BaseDataState>

    <EvaluationsSessionModal v-model:open="modalOpen" :session="session" @saved="refresh" />
  </BasePanel>
</template>
