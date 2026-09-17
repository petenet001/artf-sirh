<script setup lang="ts">
import type { AyantDroit } from "~/schemas/ayant-droit";
import { TYPE_AYANT_DROIT_LABEL, type TypeAyantDroit } from "~/constants/social";

/**
 * Dossier social d'un agent sur sa fiche : affiliations, ayants droit et
 * synthèse (enfants à charge, arbre de Noël art. 58, conjoint), servis en une
 * seule réponse par `GET /affaires-sociales/agents/{id}/dossier-social`.
 */
const props = defineProps<{ agentId: number }>();

const api = useAyantsDroitApi();
const auth = useAuthStore();

const peutGerer = computed(() => auth.can("gerer-affaires-sociales"));

const { data, pending, refresh } = useAsyncData(
  () => `dossier-social-${props.agentId}`,
  () => (props.agentId > 0 ? api.dossierSocial(props.agentId) : Promise.resolve(null)),
  { watch: [() => props.agentId] },
);
const dossier = computed(() => data.value?.data ?? null);
const synthese = computed(() => dossier.value?.synthese ?? null);
const affiliations = computed(() => dossier.value?.affiliations ?? []);
const ayantsDroit = computed(() => dossier.value?.ayants_droit ?? []);

const modalOpen = ref(false);
const piecesOpen = ref(false);
const courant = ref<AyantDroit | null>(null);

function ajouter() {
  courant.value = null;
  modalOpen.value = true;
}

function modifier(ayantDroit: AyantDroit) {
  courant.value = ayantDroit;
  modalOpen.value = true;
}

function ouvrirPieces(ayantDroit: AyantDroit) {
  courant.value = ayantDroit;
  piecesOpen.value = true;
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <BaseCardTitle icon="i-lucide-heart-handshake" title="Dossier social" />
      <UButton v-if="peutGerer" size="xs" icon="i-lucide-plus" @click="ajouter">Ayant droit</UButton>
    </div>

    <div v-if="pending" class="text-sm text-muted">Chargement…</div>

    <template v-else>
      <UAlert
        v-if="synthese && synthese.affiliation_cnss === false"
        color="warning"
        variant="subtle"
        icon="i-lucide-alert-triangle"
        title="Aucune affiliation CNSS active"
        description="L'affiliation à la CNSS est obligatoire pour un agent en poste (art. 47)."
      />

      <dl v-if="synthese" class="grid gap-x-10 gap-y-4 sm:grid-cols-2">
        <BaseDefItem label="Enfants à charge" :value="String(synthese.nb_enfants_a_charge ?? 0)" />
        <BaseDefItem
          label="Enfants arbre de Noël"
          :value="`${synthese.nb_enfants_arbre_noel ?? 0} (plafond 3)`"
        />
        <BaseDefItem label="Enfants sous tutelle" :value="String(synthese.nb_enfants_tutelle ?? 0)" />
        <BaseDefItem label="Conjoint à charge" :value="synthese.a_conjoint_a_charge ? 'Oui' : 'Non'" />
      </dl>

      <div>
        <p class="text-sm font-medium text-highlighted">Affiliations</p>
        <p v-if="!affiliations.length" class="mt-2 text-sm text-muted">Aucune affiliation.</p>
        <ul v-else class="mt-3 space-y-3">
          <li
            v-for="a in affiliations"
            :key="a.id"
            class="flex items-start justify-between gap-3 border-b border-default pb-3 last:border-0 last:pb-0"
          >
            <div class="min-w-0">
              <p class="text-sm text-highlighted">{{ a.organisme?.nom ?? "Organisme" }}</p>
              <p class="text-xs text-muted">
                {{ a.numero_affiliation ?? "Sans numéro" }} · {{ formatPeriode(a.date_debut, a.date_fin) }}
              </p>
            </div>
            <SocialStatutAffiliationBadge :statut="a.statut" :label="a.statut_label" />
          </li>
        </ul>
      </div>

      <div>
        <p class="text-sm font-medium text-highlighted">Ayants droit</p>
        <p v-if="!ayantsDroit.length" class="mt-2 text-sm text-muted">Aucun ayant droit déclaré.</p>
        <ul v-else class="mt-3 space-y-3">
          <li
            v-for="a in ayantsDroit"
            :key="a.id"
            class="flex items-start justify-between gap-3 border-b border-default pb-3 last:border-0 last:pb-0"
          >
            <div class="min-w-0">
              <p class="text-sm text-highlighted">
                {{ a.nom_complet ?? `${a.nom} ${a.prenom}` }}
                <UBadge v-if="a.eligible_arbre_noel" color="primary" variant="outline" size="sm" class="ml-1">
                  Arbre de Noël
                </UBadge>
              </p>
              <p class="text-xs text-muted">
                {{ a.type_label ?? TYPE_AYANT_DROIT_LABEL[a.type as TypeAyantDroit] }}
                <span v-if="a.age != null"> · {{ a.age }} ans</span>
                <span v-if="a.lien_juridique_label"> · {{ a.lien_juridique_label }}</span>
              </p>
            </div>
            <div class="flex shrink-0 items-center gap-1">
              <UBadge :color="a.a_charge ? 'success' : 'neutral'" variant="subtle" size="sm">
                {{ a.a_charge ? "À charge" : "Hors charge" }}
              </UBadge>
              <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-paperclip" @click="ouvrirPieces(a)" />
              <UButton
                v-if="peutGerer"
                size="xs"
                color="neutral"
                variant="ghost"
                icon="i-lucide-pencil"
                @click="modifier(a)"
              />
            </div>
          </li>
        </ul>
      </div>
    </template>

    <SocialAyantDroitModal
      v-model:open="modalOpen"
      :ayant-droit="courant"
      :agent-id="agentId"
      @saved="refresh"
    />
    <SocialPiecesModal v-model:open="piecesOpen" :ayant-droit="courant" />
  </div>
</template>
