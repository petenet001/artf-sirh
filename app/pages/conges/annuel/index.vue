<script setup lang="ts">
import type { TabsItem } from "@nuxt/ui";
import { STATUT_CAMPAGNE_COLOR, STATUT_CAMPAGNE_LABEL } from "~/constants/conges-annuels";

/**
 * Congé annuel — écran des valideurs et de la RH (`/conges-annuels`, note FE §2c).
 *
 * Isolé des autres congés : campagne de propositions, date de départ seule,
 * traitement N+1 → RH après la clôture, droit acquis après clôture et report
 * pour nécessité de service. L'agent, lui, passe par « Mes congés ».
 *
 * Trois onglets : **Propositions** (file à traiter + liste), **Campagnes**
 * (gestion RH) et **Reports**.
 */
const { courante, pending } = useCampagnesCongeAnnuel();
const annee = computed(() => courante.value?.annee ?? new Date().getFullYear());

const onglet = ref("propositions");
const tabs: TabsItem[] = [
  { label: "Propositions", icon: "i-lucide-file-text", value: "propositions", slot: "propositions" },
  { label: "Campagnes", icon: "i-lucide-calendar-range", value: "campagnes", slot: "campagnes" },
  { label: "Reports", icon: "i-lucide-calendar-clock", value: "reports", slot: "reports" },
];
</script>

<template>
  <BasePanel title="Congé annuel" subtitle="Campagne de propositions, attribution et reports">
    <template #actions>
      <UBadge
        v-if="courante"
        :color="STATUT_CAMPAGNE_COLOR[courante.statut]"
        variant="subtle"
        size="lg"
        icon="i-lucide-calendar-range"
      >
        Campagne {{ courante.annee }} · {{ courante.statut_label ?? STATUT_CAMPAGNE_LABEL[courante.statut] }}
      </UBadge>
      <UBadge v-else-if="!pending" color="neutral" variant="subtle" size="lg">Aucune campagne {{ annee }}</UBadge>
    </template>

    <UTabs v-model="onglet" :items="tabs" variant="link" :ui="{ list: 'mb-6' }">
      <template #propositions>
        <CongesAnnuelPropositions :campagne="courante" :annee="annee" />
      </template>
      <template #campagnes>
        <CongesAnnuelCampagnes />
      </template>
      <template #reports>
        <CongesAnnuelReports />
      </template>
    </UTabs>
  </BasePanel>
</template>
