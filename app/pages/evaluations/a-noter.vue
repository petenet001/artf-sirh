<script setup lang="ts">
/**
 * File du notateur (N+1) : les fiches dont il est le supérieur retenu pour la
 * notation — le poste **dominant** de l'agent sur les 24 mois précédant la
 * session (CCN art. 62), pas nécessairement son affectation du jour.
 */
const { evaluations, pending, error } = useEvaluations("a_noter");

const aTraiter = computed(() =>
  evaluations.value.filter((e) =>
    ["noter", "continuer_notation", "avis_et_signer", "corriger_notation"].includes(
      e.prochaine_etape ?? "",
    ),
  ),
);
</script>

<template>
  <BasePanel title="À noter" subtitle="Les fiches dont vous êtes le notateur (N+1)">
    <BaseDataState :pending="pending" :error="error">
      <div class="space-y-4">
        <p v-if="evaluations.length" class="text-sm text-muted">
          {{ aTraiter.length }} fiche(s) en attente d'une action de votre part sur
          {{ evaluations.length }} au total.
        </p>
        <EvaluationsTable
          :evaluations="evaluations"
          masquer="superieur"
          empty-label="Aucune fiche à noter"
        />
      </div>
    </BaseDataState>
  </BasePanel>
</template>
