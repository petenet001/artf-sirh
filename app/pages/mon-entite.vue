<script setup lang="ts">
import { STATUT_META } from "~/constants/integration-workflow";
import { statutAgentLabel } from "~/constants/personnel";

/**
 * Vue globale de **mon entité** (direction, service ou bureau) : réservée à qui
 * la dirige — le sous-onglet n'apparaît que dans ce cas (portée `"entite"`).
 * Quatre blocs : chiffres clés, sous-structures, effectif, dossiers en cours.
 */
const {
  poste,
  typeLabel,
  estResponsable,
  nom,
  enfants,
  enfantsLabel,
  effectif,
  parStatut,
  dossiers,
  pending,
  error,
} = useEntiteApercu();

/** Statuts présents dans l'effectif, triés du plus nombreux au moins nombreux. */
const repartition = computed(() =>
  Object.entries(parStatut.value).sort((a, b) => b[1] - a[1]),
);
</script>

<template>
  <BasePanel
    :title="nom ?? 'Mon entité'"
    :subtitle="typeLabel && poste ? `${typeLabel} — ${poste}` : typeLabel ?? undefined"
  >
    <!-- Compte sans responsabilité de structure : on l'explique, on ne masque pas. -->
    <UAlert
      v-if="!pending && !estResponsable"
      icon="i-lucide-info"
      color="neutral"
      variant="subtle"
      title="Aucune entité à piloter"
      description="Cette vue est réservée aux responsables d'une direction, d'un service ou d'un bureau. Elle s'appuie sur votre nomination et votre affectation active."
    />

    <BaseDataState v-else :pending="pending" :error="error" :empty="false">
      <div class="space-y-6">
        <!-- Chiffres clés -->
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <BaseStatCard label="Effectif" :value="effectif.length" icon="i-lucide-users" />
          <BaseStatCard
            v-if="enfantsLabel"
            :label="enfantsLabel"
            :value="enfants.length"
            icon="i-lucide-building-2"
          />
          <BaseStatCard
            label="Dossiers en cours"
            :value="dossiers.length"
            icon="i-lucide-folder-open"
          />
          <BaseStatCard
            label="Agents actifs"
            :value="parStatut.actif ?? 0"
            icon="i-lucide-user-check"
          />
        </div>

        <!-- Répartition par statut -->
        <UCard v-if="repartition.length">
          <template #header><span class="font-medium">Répartition de l'effectif</span></template>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="[statut, total] in repartition"
              :key="statut"
              color="neutral"
              variant="subtle"
            >
              {{ statutAgentLabel(statut) }} · {{ total }}
            </UBadge>
          </div>
        </UCard>

        <!-- Sous-structures -->
        <BaseGroupCard
          v-if="enfantsLabel"
          :title="enfantsLabel"
          :meta="`${enfants.length} rattaché${enfants.length > 1 ? 's' : ''}`"
        >
          <BaseGroupRow
            v-for="enfant in enfants"
            :key="enfant.id"
            :name="enfant.nom"
            :role="enfant.sigle"
          />
          <p v-if="!enfants.length" class="py-2 text-sm text-muted">
            Aucune sous-structure rattachée.
          </p>
        </BaseGroupCard>

        <!-- Effectif -->
        <section class="space-y-3">
          <h2 class="text-base font-semibold text-highlighted">Effectif</h2>
          <AgentsTable v-if="effectif.length" :agents="effectif" />
          <p v-else class="text-sm text-muted">Aucun agent affecté à cette entité.</p>
        </section>

        <!-- Dossiers d'intégration en cours -->
        <BaseGroupCard
          title="Arrivées en cours"
          :meta="`${dossiers.length} dossier${dossiers.length > 1 ? 's' : ''} d'intégration`"
          to="/integration/dossiers"
        >
          <BaseGroupRow
            v-for="dossier in dossiers"
            :key="dossier.id"
            :name="dossier.agent?.nom_complet ?? dossier.reference ?? `Dossier #${dossier.id}`"
            :role="dossier.statut ? STATUT_META[dossier.statut]?.label : null"
            :to="`/integration/dossiers/${dossier.id}`"
          />
          <p v-if="!dossiers.length" class="py-2 text-sm text-muted">
            Aucune arrivée en cours pour cette entité.
          </p>
        </BaseGroupCard>
      </div>
    </BaseDataState>
  </BasePanel>
</template>
