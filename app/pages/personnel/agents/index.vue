<script setup lang="ts">
import { STATUT_AGENT_OPTIONS, type StatutAgent } from "~/constants/personnel";

// Liste des agents. La création se fait sur sa propre page (formulaire long à
// 3 sections, cf. maquette) : pas de modale ici.
const { agents, pending, error, filters } = useAgents();

// L'API filtre par égalité exacte : on lie le statut directement. `archive`
// n'apparaît que filtré explicitement (hors liste par défaut côté API).
const statutItems = STATUT_AGENT_OPTIONS;

const statut = computed<StatutAgent | undefined>({
  get: () => filters.statut as StatutAgent | undefined,
  set: (v) => {
    filters.statut = v || undefined;
  },
});
</script>

<template>
  <BasePanel title="Agents" subtitle="Personnel titulaire">
    <BaseDataState :pending="pending" :error="error" :empty="!agents.length" empty-label="Aucun agent">
      <AgentsTable :agents="agents">
        <template #filters>
          <USelect v-model="statut" :items="statutItems" placeholder="Statut" class="w-44" />
        </template>
      </AgentsTable>
    </BaseDataState>
  </BasePanel>
</template>
