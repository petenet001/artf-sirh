<script setup lang="ts">
/**
 * Mon dossier : la vie courante de l'agent connecté — informations
 * personnelles et professionnelles, situation familiale, contacts d'urgence et
 * documents.
 *
 * Mêmes cartes que la fiche agent côté RH, mais sur son propre dossier : le
 * préfixe `/personnel` n'exige aucune permission, c'est donc l'agent lui-même
 * qui tient ses coordonnées à jour.
 *
 * ⚠️ Le nombre d'enfants n'est plus saisi librement dès que des enfants
 * nominatifs existent (module Affaires sociales) : l'API le recalcule.
 */
const auth = useAuthStore();

const agentId = computed(() => auth.user?.agent_id ?? 0);
const sansAgent = computed(() => !agentId.value);

const { agent, pending, error, refresh } = useFicheAgent(agentId);
</script>

<template>
  <BasePanel title="Mon dossier" subtitle="Vos informations, vos contacts et vos documents">
    <template #actions>
      <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" to="/mon-espace">Retour</UButton>
    </template>

    <UAlert
      v-if="sansAgent"
      color="warning"
      variant="subtle"
      icon="i-lucide-user-x"
      title="Aucun agent rattaché à votre compte"
      description="Votre compte n'est lié à aucun dossier d'agent."
    />

    <BaseDataState v-else :pending="pending" :error="error" :empty="!agent" empty-label="Dossier introuvable">
      <div v-if="agent" class="space-y-6">
        <PersonnelInfosPersonnellesCard
          :agent-id="agent.id"
          :infos="agent.informations_personnelles"
          can-edit
          @changed="refresh"
        />
        <PersonnelInfosProfessionnellesCard
          :agent-id="agent.id"
          :infos="agent.informations_professionnelles"
          can-edit
          @changed="refresh"
        />
        <div class="grid gap-6 lg:grid-cols-2">
          <PersonnelSituationFamilialeCard
            :agent-id="agent.id"
            :situation="agent.situation_familiale"
            can-edit
            @changed="refresh"
          />
          <PersonnelContactsUrgenceCard
            :agent-id="agent.id"
            :contacts="agent.contacts_urgence"
            can-edit
            @changed="refresh"
          />
        </div>
        <PersonnelDocumentsCard
          :agent-id="agent.id"
          :documents="agent.documents"
          can-edit
          @changed="refresh"
        />
      </div>
    </BaseDataState>
  </BasePanel>
</template>
