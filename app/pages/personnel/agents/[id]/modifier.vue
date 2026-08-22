<script setup lang="ts">
const route = useRoute();
const id = computed(() => Number(route.params.id));
const { agent, pending, error } = useAgent(id);
</script>

<template>
  <BasePanel
    :title="agent ? `Modifier ${agent.nom_complet ?? 'agent'}` : 'Modifier agent'"
    subtitle="Mise à jour de la fiche agent"
  >
    <template #actions>
      <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" :to="`/personnel/agents/${id}`">Retour</UButton>
    </template>

    <BaseDataState :pending="pending" :error="error" :empty="!agent" empty-label="Agent introuvable">
      <AgentsForm v-if="agent" :agent="agent" />
    </BaseDataState>
  </BasePanel>
</template>
