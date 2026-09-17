<script setup lang="ts">
/**
 * Avancements hors cycle de notation : bonification de stage (CCN art. 71) et
 * avancement exceptionnel (art. 72). Ils ne passent pas par une fiche
 * d'évaluation — d'où leur écran propre, à côté du tableau d'avancement.
 */
</script>

<template>
  <BasePanel title="Bonifications & exceptionnels" subtitle="Avancements accordés hors cycle de notation">
    <div class="space-y-6">
      <div class="rounded-xl border border-default bg-default p-5">
        <EvaluationsBonificationsStage />
      </div>
      <div class="rounded-xl border border-default bg-default p-5">
        <EvaluationsAvancementsExceptionnels />
      </div>
    </div>
  </BasePanel>
</template>
