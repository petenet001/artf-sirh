<script setup lang="ts">
// Vue dérivée : agents dont le type d'intégration est « Stage professionnel ».
// Même présentation que la liste des agents (`AgentsTable`) ; recherche et
// pagination sont gérées côté client par `BaseTable`.
const { stagiaires, pending, error } = useStagiaires();
</script>

<template>
  <BasePanel
    title="Stagiaires"
    subtitle="Agents intégrés via le type « Stage professionnel »"
  >
    <BaseDataState :pending="pending" :error="error" :empty="!stagiaires.length" empty-label="Aucun stagiaire">
      <AgentsTable :agents="stagiaires" />
    </BaseDataState>
  </BasePanel>
</template>
