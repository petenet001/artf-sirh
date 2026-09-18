<script setup lang="ts">
import { STATUT_AGENT_OPTIONS, type StatutAgent } from "~/constants/personnel";

/**
 * Liste des agents. La création se fait sur sa propre page (formulaire long à
 * 3 sections, cf. maquette) : pas de modale ici.
 *
 * Aux côtés du statut, des filtres de **structure** qui suivent la hiérarchie :
 * un chef de service peut descendre bureau par bureau, un directeur service
 * puis bureau, la RH parcourt l'ARTF entière. Un chef de bureau n'a rien en
 * dessous de lui : aucun contrôle ne lui est proposé.
 */
const { agents, pending, error, filters } = useAgents();
const {
  options,
  directionId,
  serviceId,
  bureauId,
  parcourable,
  affine,
  reinitialiser,
  filtrer,
  structureDe,
} = usePerimetrePersonnel();

// L'API filtre par égalité exacte : on lie le statut directement. `archive`
// n'apparaît que filtré explicitement (hors liste par défaut côté API).
const statutItems = STATUT_AGENT_OPTIONS;

const statut = computed<StatutAgent | undefined>({
  get: () => filters.statut as StatutAgent | undefined,
  set: (v) => {
    filters.statut = v || undefined;
  },
});

/** Liste réellement affichée : les filtres de structure s'appliquent après l'API. */
const lignes = computed(() => filtrer(agents.value));

/** Options d'un niveau, précédées de son « tous ». */
function avecTous(
  structures: { id: number; nom: string; sigle?: string | null }[],
  tous: string,
) {
  return [
    { label: tous, value: undefined },
    ...structures.map((s) => ({ label: s.sigle ? `${s.sigle} — ${s.nom}` : s.nom, value: s.id })),
  ];
}

/** Combien la sélection écarte, pour que le filtre se comprenne sans essayer. */
const masques = computed(() => agents.value.length - lignes.value.length);
</script>

<template>
  <BasePanel title="Agents" subtitle="Personnel titulaire">
    <BaseDataState :pending="pending" :error="error">
      <AgentsTable :agents="lignes" :structure-de="(a) => structureDe(a.affectation_active)">
        <template #filters>
          <USelect v-model="statut" :items="statutItems" placeholder="Statut" class="w-40" />

          <!--
            Les niveaux offerts sont ceux **sous** le périmètre de la personne :
            la liste vide d'un niveau le fait disparaître, sans condition écrite
            pour chaque fonction. Un chef de bureau ne voit donc rien ici.
          -->
          <USelect
            v-if="options.directions.length"
            v-model="directionId"
            :items="avecTous(options.directions, 'Toutes les directions')"
            value-key="value"
            icon="i-lucide-building-2"
            class="w-52"
          />
          <USelect
            v-if="options.services.length"
            v-model="serviceId"
            :items="avecTous(options.services, 'Tous les services')"
            value-key="value"
            icon="i-lucide-network"
            class="w-52"
          />
          <USelect
            v-if="options.bureaux.length"
            v-model="bureauId"
            :items="avecTous(options.bureaux, 'Tous les bureaux')"
            value-key="value"
            icon="i-lucide-door-open"
            class="w-52"
          />

          <UButton
            v-if="affine"
            color="neutral"
            variant="ghost"
            icon="i-lucide-rotate-ccw"
            title="Revenir à l'ensemble de votre périmètre"
            @click="reinitialiser"
          >
            Réinitialiser
          </UButton>
        </template>
      </AgentsTable>

      <!--
        « Affichage » et non « accès » : ces filtres rangent la liste, ils ne
        protègent rien. Le cloisonnement reste serveur — le formuler autrement
        laisserait croire qu'élargir donnerait accès à davantage.
      -->
      <p v-if="parcourable && affine && masques > 0" class="mt-3 text-xs text-muted">
        {{ masques }} agent{{ masques > 1 ? "s" : "" }} de votre périmètre
        {{ masques > 1 ? "sont masqués" : "est masqué" }} par ce filtre d'affichage.
      </p>
    </BaseDataState>
  </BasePanel>
</template>
