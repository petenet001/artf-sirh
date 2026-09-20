<script setup lang="ts">
import { STATUT_AGENT_OPTIONS, type StatutAgent } from "~/constants/personnel";

/**
 * Liste des agents. La création se fait sur sa propre page (formulaire long à
 * 3 sections, cf. maquette) : pas de modale ici.
 *
 * Aux côtés du statut, une **cascade de structure** qui suit la hiérarchie :
 * choisir une direction charge ses services, choisir un service charge ses
 * bureaux. Chacun ne se voit proposer que les niveaux situés sous son propre
 * périmètre — un chef de bureau n'a donc aucun de ces contrôles.
 */
const { agents, pending, error, filters } = useAgents();
const {
  optionsDirections,
  optionsServices,
  optionsBureaux,
  choixDirection,
  choixService,
  choixBureau,
  affine,
  chargement,
  maStructurePossible,
  allerAMaStructure,
  reinitialiser,
  filtrer,
  structureDe,
} = usePerimetrePersonnel();

// L'API filtre par égalité exacte : on lie le statut directement. `archive`
// n'apparaît que filtré explicitement (hors liste par défaut côté API).
const statut = computed<StatutAgent | undefined>({
  get: () => filters.statut as StatutAgent | undefined,
  set: (v) => {
    filters.statut = v || undefined;
  },
});

/** Liste réellement affichée : la cascade s'applique après l'API. */
const lignes = computed(() => filtrer(agents.value));

/** Un niveau n'est proposé que s'il contient autre chose que son « tous ». */
const aDesDirections = computed(() => optionsDirections.value.length > 1);
const aDesServices = computed(() => optionsServices.value.length > 1);
const aDesBureaux = computed(() => optionsBureaux.value.length > 1);
const aUneCascade = computed(() => aDesDirections.value || aDesServices.value || aDesBureaux.value);

/** Combien la sélection écarte, pour que le filtre se comprenne sans essayer. */
const masques = computed(() => agents.value.length - lignes.value.length);
</script>

<template>
  <BasePanel title="Agents" subtitle="Personnel titulaire">
    <BaseDataState :pending="pending" :error="error">
      <AgentsTable :agents="lignes" :structure-de="(a) => structureDe(a.affectation_active)">
        <template #filters>
          <USelect
            v-model="statut"
            :items="STATUT_AGENT_OPTIONS"
            placeholder="Statut"
            class="w-36"
          />

          <!--
            Les trois niveaux sur une seule ligne, joints : ils forment un seul
            filtre « où ? » qu'on lit de gauche à droite, du plus large au plus
            fin. Un niveau vide ne s'affiche pas — c'est ce qui fait qu'un chef
            de bureau ne voit rien ici, sans condition écrite pour lui.
          -->
          <UFieldGroup v-if="aUneCascade">
            <USelect
              v-if="aDesDirections"
              v-model="choixDirection"
              :items="optionsDirections"
              value-key="value"
              icon="i-lucide-building-2"
              :loading="chargement"
              class="w-48"
            />
            <USelect
              v-if="aDesServices"
              v-model="choixService"
              :items="optionsServices"
              value-key="value"
              icon="i-lucide-network"
              :loading="chargement"
              class="w-48"
            />
            <USelect
              v-if="aDesBureaux"
              v-model="choixBureau"
              :items="optionsBureaux"
              value-key="value"
              icon="i-lucide-door-open"
              :loading="chargement"
              class="w-48"
            />
          </UFieldGroup>

          <!-- Raccourci du chef qui voit plus large que son équipe. -->
          <UButton
            v-if="maStructurePossible"
            color="neutral"
            variant="subtle"
            icon="i-lucide-scan-eye"
            :loading="chargement"
            title="Cadrer sur la structure à laquelle vous êtes rattaché"
            @click="allerAMaStructure"
          >
            Ma structure
          </UButton>

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
      <p v-if="affine && masques > 0" class="mt-3 text-xs text-muted">
        {{ masques }} agent{{ masques > 1 ? "s" : "" }} de votre périmètre
        {{ masques > 1 ? "sont masqués" : "est masqué" }} par ce filtre d'affichage.
      </p>
    </BaseDataState>
  </BasePanel>
</template>
