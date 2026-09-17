<script setup lang="ts">
import {
  STATUT_RECLASSEMENT_LABEL,
  TYPE_RECLASSEMENT_LABEL,
  type StatutReclassement,
  type TypeReclassement,
} from "~/constants/reclassements";

/**
 * Historique des reclassements d'un agent (CCN art. 73–75), sur sa fiche. C'est
 * aussi le point de départ d'un nouveau dossier : le reclassement se décide
 * agent par agent, pas depuis une liste globale.
 */
const props = defineProps<{ agentId: number }>();

const api = useReclassementsApi();
const auth = useAuthStore();

const { data, pending, refresh } = useAsyncData(
  () => `agent-reclassements-${props.agentId}`,
  () => (props.agentId > 0 ? api.byAgent(props.agentId) : Promise.resolve(null)),
  { watch: [() => props.agentId] },
);
const reclassements = computed(() => data.value?.data ?? []);

const peutCreer = computed(() => auth.can("gerer-salaires"));
const modalOpen = ref(false);
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <BaseCardTitle icon="i-lucide-arrow-up-narrow-wide" title="Reclassements (art. 73–75)" />
      <UButton v-if="peutCreer" size="xs" icon="i-lucide-plus" @click="modalOpen = true">Nouveau</UButton>
    </div>

    <div v-if="pending" class="mt-4 text-sm text-muted">Chargement…</div>
    <p v-else-if="!reclassements.length" class="mt-4 text-sm text-muted">
      Aucun reclassement pour cet agent.
    </p>
    <ul v-else class="mt-4 space-y-3">
      <li
        v-for="r in reclassements"
        :key="r.id"
        class="flex items-start justify-between gap-3 border-b border-default pb-3 last:border-0 last:pb-0"
      >
        <div class="min-w-0">
          <NuxtLink :to="`/carriere/reclassements/${r.id}`" class="text-sm font-medium text-primary hover:underline">
            {{ r.type_label ?? TYPE_RECLASSEMENT_LABEL[r.type as TypeReclassement] }}
          </NuxtLink>
          <p class="text-xs text-muted">
            {{ formatDate(r.created_at) }}
            <span v-if="r.classe_cible?.grade"> · vers {{ r.classe_cible.grade }}</span>
          </p>
        </div>
        <ReclassementsStatutBadge
          :statut="r.statut"
          :label="r.statut_label ?? STATUT_RECLASSEMENT_LABEL[r.statut as StatutReclassement]"
        />
      </li>
    </ul>

    <ReclassementsModal v-model:open="modalOpen" :agent-id="agentId" @created="refresh" />
  </div>
</template>
