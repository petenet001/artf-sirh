<script setup lang="ts">
import { LIBELLE_NIVEAU, vueEffective } from "~/constants/utilisateurs";

/**
 * Périmètre de l'utilisateur, quand il est restreint (vague F).
 *
 * Le backend filtre les listes — agents, congés, absences, sanctions — au
 * bureau, au service ou à la direction. Le front n'y participe pas, mais il
 * doit le **dire** : sans ce repère, quelqu'un qui voit douze agents là où son
 * collègue en voit deux cents conclut à un bug, pas à une règle.
 *
 * On lit `vue_personnel`, que le serveur calcule, et **jamais** le seul
 * `bureau_id` : depuis `consulter-agents-global`, un compte du métier RH est
 * rattaché à un bureau tout en voyant l'effectif entier. Déduire du
 * rattachement afficherait une restriction qui n'existe pas.
 *
 * Rien n'est affiché sur une vue globale : un badge « vous voyez tout »
 * n'apprend rien à personne.
 */
const auth = useAuthStore();

const vue = computed(() => (auth.user ? vueEffective(auth.user) : "globale"));
const restreint = computed(() => vue.value !== "globale");

const bureau = computed(() => auth.user?.bureau);
const libelle = computed(() => bureau.value?.sigle ?? bureau.value?.nom ?? "périmètre restreint");

const infobulle = computed(
  () =>
    `Les listes d'agents, de congés, d'absences et de dossiers disciplinaires sont limitées à `
    + `${LIBELLE_NIVEAU[vue.value]}${bureau.value?.nom ? ` (${bureau.value.nom})` : ""}.`,
);
</script>

<template>
  <UBadge
    v-if="restreint"
    color="neutral"
    variant="subtle"
    icon="i-lucide-scan-eye"
    :title="infobulle"
    class="hidden sm:inline-flex"
  >
    Vue&nbsp;: {{ libelle }}
  </UBadge>
</template>
