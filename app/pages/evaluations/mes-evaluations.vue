<script setup lang="ts">
/**
 * Fiches d'évaluation de l'agent connecté (CCN art. 63) : il en prend
 * connaissance, les signe, peut les contester puis les transmettre à la RH.
 * La route déduit l'agent du token — aucun filtre serveur n'est accepté.
 */
const auth = useAuthStore();
const { evaluations, pending, error } = useEvaluations("mine");

const sansAgent = computed(() => !auth.user?.agent_id);
</script>

<template>
  <BasePanel title="Mes évaluations" subtitle="Vos fiches de notation et leur avancement">
    <UAlert
      v-if="sansAgent"
      color="warning"
      variant="subtle"
      icon="i-lucide-user-x"
      title="Aucun agent rattaché à votre compte"
      description="Votre compte n'est lié à aucun dossier d'agent : vous n'avez donc pas de fiche d'évaluation."
    />
    <BaseDataState v-else :pending="pending" :error="error">
      <EvaluationsTable
        :evaluations="evaluations"
        masquer="agent"
        :searchable="false"
        empty-label="Aucune fiche d'évaluation vous concernant"
      />
    </BaseDataState>
  </BasePanel>
</template>
