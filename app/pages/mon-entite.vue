<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { STATUT_META } from "~/constants/integration-workflow";
import { ENTITE_LABEL, LIBELLE_NIVEAU_ENTITE } from "~/constants/entite";
import type { LigneEffectif } from "~/utils/entite";

/**
 * Vue de **mon entité**, de mon niveau jusqu'en bas : le DG voit l'ARTF, un
 * directeur sa direction avec ses services et leurs bureaux, un chef de service
 * son service et ses bureaux, un chef de bureau son bureau.
 */
const {
  poste,
  resolution,
  typeLabel,
  racine,
  nom,
  effectif,
  nbDirections,
  nbServices,
  nbBureaux,
  dossiers,
  dossiersIndisponibles,
  pending,
  error,
} = useEntiteApercu();

/**
 * Les dossiers vivent dans le module Intégration, réservé à `consulter-recrutement`.
 * Sans cette permission, un lien mènerait à un refus : on liste sans lier.
 */
const auth = useAuthStore();
const peutOuvrirDossiers = computed(() => auth.can("consulter-recrutement"));

/** Pourquoi l'entité ne s'ouvre pas, quand c'est le cas. */
const blocage = computed(() => {
  const r = resolution.value;
  if (r.etat === "aucune") {
    return {
      color: "neutral" as const,
      title: "Aucune entité à piloter",
      description:
        "Cette vue est réservée au directeur général, aux directeurs, aux chefs de service et aux chefs de bureau.",
    };
  }
  if (r.etat === "sans-affectation") {
    return {
      color: "warning" as const,
      title: "Affectation introuvable",
      description: `Votre compte a le rôle de ${LIBELLE_NIVEAU_ENTITE[r.niveau]}, mais votre fiche agent n'a pas d'affectation active. Contactez la DRHL pour la régulariser.`,
    };
  }
  if (r.etat === "incoherente") {
    return {
      color: "warning" as const,
      title: "Affectation à vérifier",
      description: `Votre compte a le rôle de ${LIBELLE_NIVEAU_ENTITE[r.niveau]}, mais vous êtes affecté à une structure de type « ${ENTITE_LABEL[r.type]} ». Contactez la DRHL pour mettre votre affectation ou votre rôle en cohérence.`,
    };
  }
  return null;
});

/** Chiffres clés : seuls les niveaux présents sous l'entité. */
const chiffres = computed(() => [
  { label: "Effectif total", value: racine.value?.total ?? 0, icon: "i-lucide-users" },
  ...(nbDirections.value ? [{ label: "Directions", value: nbDirections.value, icon: "i-lucide-landmark" }] : []),
  ...(nbServices.value ? [{ label: "Services", value: nbServices.value, icon: "i-lucide-building-2" }] : []),
  ...(nbBureaux.value ? [{ label: "Bureaux", value: nbBureaux.value, icon: "i-lucide-door-open" }] : []),
  { label: "Arrivées en cours", value: dossiers.value.length, icon: "i-lucide-folder-open" },
]);

const colonnes: TableColumn<LigneEffectif>[] = [
  { accessorKey: "nom_complet", header: "Agent" },
  { accessorKey: "matricule", header: "Matricule" },
  { accessorKey: "structure", header: "Structure" },
];
</script>

<template>
  <BasePanel
    :title="nom ?? 'Mon entité'"
    :subtitle="typeLabel && poste ? `${typeLabel} — ${poste}` : typeLabel ?? undefined"
  >
    <UAlert
      v-if="!pending && blocage"
      icon="i-lucide-info"
      :color="blocage.color"
      variant="subtle"
      :title="blocage.title"
      :description="blocage.description"
    />

    <BaseDataState v-else :pending="pending" :error="error" :empty="false">
      <div v-if="racine" class="space-y-6">
        <!-- Chiffres clés -->
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <BaseStatCard v-for="c in chiffres" :key="c.label" :label="c.label" :value="c.value" :icon="c.icon" />
        </div>

        <!-- Organisation, de mon niveau jusqu'en bas -->
        <section class="space-y-3">
          <h2 class="text-base font-semibold text-highlighted">Organisation</h2>

          <BaseGroupCard
            v-if="racine.agents.length"
            :title="`Rattachés directement à ${racine.sigle || racine.nom}`"
            :meta="`${racine.agents.length} agent${racine.agents.length > 1 ? 's' : ''}`"
          >
            <BaseGroupRow
              v-for="agent in racine.agents"
              :key="agent.id"
              :name="agent.nom_complet ?? `${agent.prenom} ${agent.nom}`"
              :role="agent.matricule ?? 'Matricule non assigné'"
              :src="agent.photo_path"
              :to="`/personnel/agents/${agent.id}`"
            />
          </BaseGroupCard>

          <div v-if="racine.enfants.length" class="space-y-2">
            <EntiteNoeud v-for="enfant in racine.enfants" :key="`${enfant.type}-${enfant.id}`" :noeud="enfant" />
          </div>

          <p v-if="!racine.total" class="text-sm text-muted">Aucun agent affecté à cette entité.</p>
        </section>

        <!-- Tout l'effectif, pour chercher quelqu'un -->
        <section v-if="effectif.length" class="space-y-3">
          <h2 class="text-base font-semibold text-highlighted">Tout l'effectif</h2>
          <BaseTable
            :data="effectif"
            :columns="colonnes"
            searchable
            search-placeholder="Rechercher (nom, matricule, structure…)"
            :page-size="10"
            :row-to="(l) => `/personnel/agents/${l.id}`"
          >
            <template #nom_complet-cell="{ row }">
              <BasePersonCell :name="row!.original.nom_complet" :src="row!.original.photo_path" />
            </template>
          </BaseTable>
        </section>

        <!-- Dossiers d'intégration en cours -->
        <BaseGroupCard
          title="Arrivées en cours"
          :meta="`${dossiers.length} dossier${dossiers.length > 1 ? 's' : ''} d'intégration`"
          :to="peutOuvrirDossiers ? '/integration/dossiers' : undefined"
        >
          <BaseGroupRow
            v-for="dossier in dossiers"
            :key="dossier.id"
            :name="dossier.agent?.nom_complet ?? dossier.reference ?? `Dossier #${dossier.id}`"
            :role="dossier.statut ? STATUT_META[dossier.statut]?.label : null"
            :to="peutOuvrirDossiers ? `/integration/dossiers/${dossier.id}` : undefined"
          />
          <p v-if="dossiersIndisponibles" class="py-2 text-sm text-muted">
            Les dossiers d'intégration n'ont pas pu être chargés.
          </p>
          <p v-else-if="!dossiers.length" class="py-2 text-sm text-muted">
            Aucune arrivée en cours pour cette entité.
          </p>
        </BaseGroupCard>
      </div>
    </BaseDataState>
  </BasePanel>
</template>
