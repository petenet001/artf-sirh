<script setup lang="ts">
import { TYPES_PIECE_SANTE } from "~/constants/enums";
import {
  agentNom,
  ARTICLE_PRISE_EN_CHARGE,
  dossierClos,
  formatMontant,
  priseEnChargeAvecSejour,
  TYPE_PIECE_SANTE_LABEL,
  TYPE_PRISE_EN_CHARGE_LABEL,
} from "~/constants/dossiers-sociaux";

/**
 * Fiche d'une prise en charge médicale.
 *
 * Trois montants, comme pour les prestations : ce que la structure a facturé,
 * ce que la convention couvre, ce qui a été accordé. Le reste à charge de
 * l'agent est la différence entre le premier et le dernier — on l'affiche,
 * parce que c'est la seule question que l'intéressé se pose vraiment.
 */
const route = useRoute();
const api = usePrisesEnChargeApi();
const acteur = useActeurDossierSocial();
const handleError = useApiError();

const id = computed(() => Number(route.params.id));

const { data, pending, error, refresh } = useAsyncData(
  () => `prise-en-charge-${id.value}`,
  () => api.getById(id.value),
  { watch: [id] },
);
const prise = computed(() => data.value?.data ?? null);

const typesPiece = TYPES_PIECE_SANTE.map((t) => ({ label: TYPE_PIECE_SANTE_LABEL[t], value: t }));

const busy = ref(false);

async function telechargerDecision() {
  busy.value = true;
  try {
    downloadBlob(await api.pdfDecision(id.value), `decision-prise-en-charge-${id.value}.pdf`);
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

/**
 * Reste à charge : facturé moins accordé. Calculé seulement une fois la
 * décision prise — avant, il n'existe pas, et l'annoncer à zéro serait un
 * mensonge par avance.
 */
const resteACharge = computed(() => {
  const p = prise.value;
  if (p?.montant_facture == null || p?.montant_accorde == null) return null;
  return Math.max(0, p.montant_facture - p.montant_accorde);
});
</script>

<template>
  <BasePanel title="Prise en charge médicale" subtitle="Instruction et décision (art. 122–127)">
    <template #actions>
      <UButton
        v-if="prise && dossierClos(prise.statut) && prise.statut !== 'classee'"
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
      <div v-if="prise" class="space-y-4">
        <div class="rounded-xl border border-default bg-default p-5">
          <div class="flex flex-wrap items-center gap-3">
            <h2 class="text-lg font-semibold text-highlighted">
              {{ prise.type_label ?? (prise.type ? TYPE_PRISE_EN_CHARGE_LABEL[prise.type] : "Prise en charge") }}
            </h2>
            <UBadge v-if="prise.at_mp" color="warning" variant="subtle">AT/MP</UBadge>
          </div>
          <p class="text-sm text-muted">
            {{ prise.article_ccn ?? (prise.type ? ARTICLE_PRISE_EN_CHARGE[prise.type] : "") }}
            · {{ agentNom(prise.agent) }}
          </p>

          <dl class="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            <BaseInfoItem icon="i-lucide-calendar" label="Date des soins" :value="formatDateLong(prise.date_soins)" />
            <BaseInfoItem icon="i-lucide-hospital" label="Structure" :value="prise.structure?.nom ?? '—'" />
            <BaseInfoItem
              v-if="prise.ayant_droit_id"
              icon="i-lucide-users"
              label="Bénéficiaire"
              :value="`Ayant droit nº ${prise.ayant_droit_id}`"
            />
            <BaseInfoItem v-if="prise.lieu" icon="i-lucide-map-pin" label="Lieu" :value="prise.lieu" />
            <BaseInfoItem
              v-if="priseEnChargeAvecSejour(prise.type) && prise.date_debut"
              icon="i-lucide-calendar-range"
              label="Séjour"
              :value="prise.date_fin
                ? `${formatDate(prise.date_debut)} → ${formatDate(prise.date_fin)}`
                : `Depuis le ${formatDate(prise.date_debut)}`"
            />
          </dl>
        </div>

        <div class="rounded-xl border border-default bg-default p-5">
          <BaseCardTitle icon="i-lucide-coins" title="Montants" />
          <div class="mt-4 grid gap-4 sm:grid-cols-4">
            <div>
              <p class="text-xs uppercase tracking-wide text-muted">Facturé</p>
              <p class="mt-1 text-lg font-semibold tabular-nums text-highlighted">
                {{ formatMontant(prise.montant_facture) }}
              </p>
            </div>
            <div>
              <p class="text-xs uppercase tracking-wide text-muted">Couvert par la CCN</p>
              <p class="mt-1 text-lg font-semibold tabular-nums text-highlighted">
                {{ formatMontant(prise.montant_calcule) }}
              </p>
            </div>
            <div>
              <p class="text-xs uppercase tracking-wide text-muted">Accordé</p>
              <p class="mt-1 text-lg font-semibold tabular-nums text-highlighted">
                {{ formatMontant(prise.montant_accorde) }}
              </p>
            </div>
            <div>
              <p class="text-xs uppercase tracking-wide text-muted">Reste à charge</p>
              <p class="mt-1 text-lg font-semibold tabular-nums text-highlighted">
                {{ resteACharge == null ? "—" : formatMontant(resteACharge) }}
              </p>
              <p class="mt-1 text-xs text-muted">
                {{ resteACharge == null ? "Connu après la décision." : "Ce qui reste à l'agent." }}
              </p>
            </div>
          </div>
        </div>

        <SocialCircuitDossier
          :dossier="prise"
          :api="api"
          note-fin="Le circuit est terminé. Le PDF de décision reste téléchargeable."
          @changed="refresh"
        />

        <div
          v-if="prise.notes_instruction || prise.commentaire_decision"
          class="rounded-xl border border-default bg-default p-5"
        >
          <BaseCardTitle icon="i-lucide-file-text" title="Instruction et décision" />
          <div class="mt-4 space-y-4">
            <div v-if="prise.notes_instruction">
              <p class="text-xs uppercase tracking-wide text-muted">Notes d'instruction</p>
              <p class="mt-1 whitespace-pre-line text-sm text-toned">{{ prise.notes_instruction }}</p>
            </div>
            <div v-if="prise.commentaire_decision">
              <p class="text-xs uppercase tracking-wide text-muted">
                Motif de la décision
                <span v-if="prise.date_decision"> · {{ formatDateLong(prise.date_decision) }}</span>
              </p>
              <p class="mt-1 whitespace-pre-line text-sm text-toned">{{ prise.commentaire_decision }}</p>
            </div>
          </div>
        </div>

        <SocialPiecesDossier
          v-if="acteur.peutGerer || (prise.pieces?.length ?? 0) > 0"
          :dossier="prise"
          :api="api"
          :types="typesPiece"
          cle="prise-en-charge"
          @changed="refresh"
        />
      </div>
    </BaseDataState>
  </BasePanel>
</template>
