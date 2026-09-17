<script setup lang="ts">
import { ETAPE_POSITION_LABEL, TYPE_POSITION_LABEL, type EtapePosition, type TypePosition } from "~/constants/positions";

/**
 * Historique des positions conventionnelles d'un agent (CCN art. 76–80), sur
 * sa fiche. C'est ici que se met en détachement ou en disponibilité — le champ
 * « statut » du formulaire agent ne l'accepte plus.
 */
const props = defineProps<{ agentId: number }>();

const api = usePositionsApi();
const auth = useAuthStore();

const { data, pending, refresh } = useAsyncData(
  () => `agent-positions-${props.agentId}`,
  () => (props.agentId > 0 ? api.byAgent(props.agentId) : Promise.resolve(null)),
  { watch: [() => props.agentId] },
);
const positions = computed(() => data.value?.data ?? []);

const peutCreer = computed(() => auth.can("gerer-salaires"));
const modalOpen = ref(false);
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <BaseCardTitle icon="i-lucide-user-cog" title="Positions conventionnelles (art. 76–80)" />
      <UButton v-if="peutCreer" size="xs" icon="i-lucide-plus" @click="modalOpen = true">Nouvelle</UButton>
    </div>

    <div v-if="pending" class="mt-4 text-sm text-muted">Chargement…</div>
    <p v-else-if="!positions.length" class="mt-4 text-sm text-muted">
      Aucune position conventionnelle pour cet agent.
    </p>
    <ul v-else class="mt-4 space-y-3">
      <li
        v-for="p in positions"
        :key="p.id"
        class="flex items-start justify-between gap-3 border-b border-default pb-3 last:border-0 last:pb-0"
      >
        <div class="min-w-0">
          <NuxtLink :to="`/carriere/positions/${p.id}`" class="text-sm text-primary hover:underline">
            {{ p.type_label ?? TYPE_POSITION_LABEL[p.type as TypePosition] }}
          </NuxtLink>
          <p class="text-xs text-muted">{{ formatPeriode(p.date_debut, p.date_fin) }}</p>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <PositionsStatutBadge :statut="p.statut" :label="p.statut_label" />
          <UBadge v-if="p.prochaine_etape" color="neutral" variant="outline" size="sm">
            {{ ETAPE_POSITION_LABEL[p.prochaine_etape as EtapePosition] }}
          </UBadge>
        </div>
      </li>
    </ul>

    <PositionsModal v-model:open="modalOpen" :agent-id="agentId" @created="refresh" />
  </div>
</template>
