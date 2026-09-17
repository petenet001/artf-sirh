<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Absence } from "~/schemas/absence";
import { STATUT_ABSENCE_LABEL } from "~/constants/conges";

/**
 * Mes absences : celles du compte connecté, et la déclaration en son nom.
 *
 * Écran **personnel** : `absences/agents/{id}` est indexée par agent, donc
 * lisible sans permission de validation. La déclaration part en mode
 * « pour moi » — pas de sélection d'agent.
 */
const auth = useAuthStore();
const api = useAbsencesApi();

const agentId = computed(() => auth.user?.agent_id ?? 0);
const sansAgent = computed(() => !agentId.value);

const { data, pending, error, refresh } = useAsyncData(
  () => `mes-absences-${agentId.value}`,
  () => (agentId.value ? api.byAgent(agentId.value) : Promise.resolve(null)),
  { watch: [agentId] },
);
const absences = computed(() => data.value?.data ?? []);

const peutCreer = computed(() => auth.can("creer-absences"));
const modalOpen = ref(false);

const columns: TableColumn<Absence>[] = [
  { id: "type", header: "Type", cell: ({ row }) => row.original.type_absence?.nom ?? "—" },
  {
    id: "periode",
    header: "Période",
    cell: ({ row }) => formatPeriode(row.original.date_debut, row.original.date_fin),
  },
  { id: "justifiee", header: "Justifiée" },
  { id: "statut", header: "Statut" },
];
</script>

<template>
  <BasePanel title="Mes absences" subtitle="Vos absences déclarées et leur suivi">
    <template #actions>
      <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" to="/mon-espace">Retour</UButton>
    </template>

    <UAlert
      v-if="sansAgent"
      color="warning"
      variant="subtle"
      icon="i-lucide-user-x"
      title="Aucun agent rattaché à votre compte"
      description="Votre compte n'est lié à aucun dossier d'agent : vous ne pouvez pas déclarer d'absence."
    />

    <BaseDataState v-else :pending="pending" :error="error">
      <BaseTable :data="absences" :columns="columns" :page-size="10">
        <template #actions>
          <UButton v-if="peutCreer" icon="i-lucide-plus" @click="modalOpen = true">Déclarer une absence</UButton>
        </template>
        <template #empty>
          <p class="py-6 text-center text-sm text-muted">Aucune absence déclarée.</p>
        </template>
        <template #justifiee-cell="{ row }">
          <UBadge :color="row!.original.justifiee ? 'success' : 'neutral'" variant="subtle" size="sm">
            {{ row!.original.justifiee ? "Oui" : "Non" }}
          </UBadge>
        </template>
        <template #statut-cell="{ row }">
          <CongesAbsenceStatutBadge
            :statut="row!.original.statut"
            :label="row!.original.statut_label ?? STATUT_ABSENCE_LABEL[row!.original.statut!]"
          />
        </template>
      </BaseTable>
    </BaseDataState>

    <CongesAbsenceModal v-model:open="modalOpen" pour-moi @created="refresh" />
  </BasePanel>
</template>
