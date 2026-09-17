<script setup lang="ts">
import { STATUT_SANCTION_LABEL, type StatutSanction } from "~/constants/discipline";

/**
 * Historique disciplinaire d'un agent sur sa fiche (RH) : sanctions,
 * avertissements et indicateur de récidive sur 5 ans, renvoyés en une seule
 * réponse par `GET /discipline/agents/{id}/historique`.
 *
 * C'est aussi le point de départ d'un rapport : la discipline se décide agent
 * par agent.
 */
const props = defineProps<{ agentId: number }>();

const api = useSanctionsApi();
const acteur = useActeurDiscipline();

const { data, pending, refresh } = useAsyncData(
  () => `agent-discipline-${props.agentId}`,
  () => (props.agentId > 0 ? api.historiqueAgent(props.agentId) : Promise.resolve(null)),
  { watch: [() => props.agentId] },
);
const historique = computed(() => data.value?.data ?? null);
const sanctions = computed(() => historique.value?.sanctions ?? []);
const avertissements = computed(() => historique.value?.avertissements ?? []);

const modalOpen = ref(false);
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <BaseCardTitle icon="i-lucide-shield-alert" title="Dossier disciplinaire" />
      <UButton v-if="acteur.peutProposer" size="xs" icon="i-lucide-plus" @click="modalOpen = true">
        Nouveau rapport
      </UButton>
    </div>

    <UAlert
      v-if="historique?.recidive"
      color="warning"
      variant="subtle"
      icon="i-lucide-alert-triangle"
      title="Récidive"
      description="Au moins une sanction a été prononcée sur les cinq dernières années."
    />

    <div v-if="pending" class="text-sm text-muted">Chargement…</div>

    <template v-else>
      <div>
        <p class="text-sm font-medium text-highlighted">Sanctions</p>
        <p v-if="!sanctions.length" class="mt-2 text-sm text-muted">Aucune sanction.</p>
        <ul v-else class="mt-3 space-y-3">
          <li
            v-for="s in sanctions"
            :key="s.id"
            class="flex items-start justify-between gap-3 border-b border-default pb-3 last:border-0 last:pb-0"
          >
            <div class="min-w-0">
              <NuxtLink :to="`/discipline/dossiers/${s.id}`" class="text-sm text-primary hover:underline">
                {{ s.type_sanction?.nom ?? "Sanction" }}
              </NuxtLink>
              <p class="text-xs text-muted">
                Faits du {{ formatDate(s.date_faits) }}
                <span v-if="s.conservee_jusqu_au"> · conservée jusqu'au {{ formatDate(s.conservee_jusqu_au) }}</span>
              </p>
            </div>
            <DisciplineStatutBadge
              :statut="s.statut"
              :label="s.statut_label ?? STATUT_SANCTION_LABEL[s.statut as StatutSanction]"
            />
          </li>
        </ul>
      </div>

      <div>
        <p class="text-sm font-medium text-highlighted">Avertissements</p>
        <p v-if="!avertissements.length" class="mt-2 text-sm text-muted">Aucun avertissement.</p>
        <ul v-else class="mt-3 space-y-3">
          <li v-for="a in avertissements" :key="a.id" class="border-b border-default pb-3 last:border-0 last:pb-0">
            <p class="text-xs text-muted">{{ formatDate(a.date) }}</p>
            <p class="mt-1 text-sm text-default">{{ a.motif }}</p>
          </li>
        </ul>
      </div>
    </template>

    <DisciplineRapportModal v-model:open="modalOpen" :agent-id="agentId" @created="refresh" />
  </div>
</template>
