<script setup lang="ts">
import { TYPES_PIECE_SANTE } from "~/constants/enums";
import {
  agentNom,
  dossierClos,
  formatMontant,
  NATURE_ARRET_LABEL,
  origineProfessionnelle,
  TYPE_PIECE_SANTE_LABEL,
} from "~/constants/dossiers-sociaux";

/**
 * Fiche d'un arrêt de santé.
 *
 * L'indemnisation CCN se lit en **deux temps** : des mois à plein traitement,
 * puis des mois à demi-traitement. Les afficher côte à côte évite la lecture
 * fausse la plus courante — croire que le montant mensuel vaut pour toute la
 * durée de l'arrêt.
 */
const route = useRoute();
const api = useArretsSanteApi();
const acteur = useActeurDossierSocial();
const handleError = useApiError();

const id = computed(() => Number(route.params.id));

const { data, pending, error, refresh } = useAsyncData(
  () => `arret-${id.value}`,
  () => api.getById(id.value),
  { watch: [id] },
);
const arret = computed(() => data.value?.data ?? null);

const typesPiece = TYPES_PIECE_SANTE.map((t) => ({ label: TYPE_PIECE_SANTE_LABEL[t], value: t }));

const busy = ref(false);

async function telechargerDecision() {
  busy.value = true;
  try {
    downloadBlob(await api.pdfDecision(id.value), `decision-arret-${id.value}.pdf`);
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

/** Total indemnisé sur la durée, plein et demi-traitement cumulés. */
const totalIndemnise = computed(() => {
  const a = arret.value;
  if (!a?.montant_mensuel) return null;
  const plein = (a.nb_mois ?? 0) * a.montant_mensuel;
  const demi = (a.nb_mois_majoration ?? 0) * (a.montant_mensuel_demi ?? 0);
  return plein + demi;
});
</script>

<template>
  <BasePanel title="Arrêt de santé" subtitle="Instruction et indemnisation (art. 132–135)">
    <template #actions>
      <UButton
        v-if="arret && dossierClos(arret.statut) && arret.statut !== 'classee'"
        color="neutral"
        variant="soft"
        icon="i-lucide-file-down"
        :loading="busy"
        @click="telechargerDecision"
      >
        PDF de décision
      </UButton>
    </template>

    <BaseDataState :pending="pending" :error="error">
      <div v-if="arret" class="space-y-4">
        <div class="rounded-xl border border-default bg-default p-5">
          <div class="flex flex-wrap items-center gap-3">
            <h2 class="text-lg font-semibold text-highlighted">
              {{ arret.nature_label ?? (arret.nature ? NATURE_ARRET_LABEL[arret.nature] : "Arrêt") }}
            </h2>
            <UBadge v-if="origineProfessionnelle(arret.nature)" color="warning" variant="subtle">
              Origine professionnelle
            </UBadge>
          </div>
          <p class="text-sm text-muted">
            {{ arret.article_ccn ?? "art. 132–135" }} · {{ agentNom(arret.agent) }}
          </p>

          <dl class="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            <BaseInfoItem icon="i-lucide-calendar" label="Date du fait" :value="formatDateLong(arret.date_fait)" />
            <BaseInfoItem
              icon="i-lucide-bell"
              label="Notifié le"
              :value="formatDateLong(arret.date_notification)"
            />
            <BaseInfoItem
              icon="i-lucide-calendar-range"
              label="Période d'arrêt"
              :value="arret.date_fin
                ? `${formatDate(arret.date_debut)} → ${formatDate(arret.date_fin)}`
                : `Depuis le ${formatDate(arret.date_debut)}, en cours`"
            />
            <BaseInfoItem
              icon="i-lucide-hospital"
              label="Structure sanitaire"
              :value="arret.structure?.nom ?? '—'"
            />
            <BaseInfoItem
              v-if="arret.demande_conge_id"
              icon="i-lucide-link"
              label="Demande de congé liée"
              :value="`nº ${arret.demande_conge_id}`"
              :to="`/conges/demandes/${arret.demande_conge_id}`"
            />
          </dl>
        </div>

        <!-- Indemnisation : plein puis demi-traitement -->
        <div v-if="arret.montant_mensuel != null" class="rounded-xl border border-default bg-default p-5">
          <BaseCardTitle icon="i-lucide-coins" title="Indemnisation" />
          <p class="mt-1 text-xs text-muted">
            La convention indemnise en deux temps : le plein traitement d'abord, le demi-traitement
            ensuite. Les durées dépendent de l'ancienneté et de la nature de l'arrêt.
          </p>
          <div class="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <p class="text-xs uppercase tracking-wide text-muted">Plein traitement</p>
              <p class="mt-1 text-lg font-semibold tabular-nums text-highlighted">
                {{ formatMontant(arret.montant_mensuel) }}
              </p>
              <p class="mt-1 text-xs text-muted">
                pendant {{ arret.nb_mois ?? 0 }} mois
              </p>
            </div>
            <div>
              <p class="text-xs uppercase tracking-wide text-muted">Demi-traitement</p>
              <p class="mt-1 text-lg font-semibold tabular-nums text-highlighted">
                {{ formatMontant(arret.montant_mensuel_demi) }}
              </p>
              <p class="mt-1 text-xs text-muted">
                pendant {{ arret.nb_mois_majoration ?? 0 }} mois
              </p>
            </div>
            <div>
              <p class="text-xs uppercase tracking-wide text-muted">Total sur la durée</p>
              <p class="mt-1 text-lg font-semibold tabular-nums text-highlighted">
                {{ formatMontant(totalIndemnise) }}
              </p>
              <p class="mt-1 text-xs text-muted">si l'arrêt va à son terme</p>
            </div>
          </div>
        </div>

        <SocialCircuitDossier
          :dossier="arret"
          :api="api"
          note-fin="Le circuit est terminé. Le PDF de décision reste téléchargeable."
          @changed="refresh"
        />

        <div
          v-if="arret.notes_instruction || arret.commentaire_decision"
          class="rounded-xl border border-default bg-default p-5"
        >
          <BaseCardTitle icon="i-lucide-file-text" title="Instruction et décision" />
          <div class="mt-4 space-y-4">
            <div v-if="arret.notes_instruction">
              <p class="text-xs uppercase tracking-wide text-muted">Notes d'instruction</p>
              <p class="mt-1 whitespace-pre-line text-sm text-toned">{{ arret.notes_instruction }}</p>
            </div>
            <div v-if="arret.commentaire_decision">
              <p class="text-xs uppercase tracking-wide text-muted">
                Motif de la décision
                <span v-if="arret.date_decision"> · {{ formatDateLong(arret.date_decision) }}</span>
              </p>
              <p class="mt-1 whitespace-pre-line text-sm text-toned">{{ arret.commentaire_decision }}</p>
            </div>
          </div>
        </div>

        <SocialPiecesDossier
          v-if="acteur.peutGerer || (arret.pieces?.length ?? 0) > 0"
          :dossier="arret"
          :api="api"
          :types="typesPiece"
          cle="arret"
          @changed="refresh"
        />
      </div>
    </BaseDataState>
  </BasePanel>
</template>
