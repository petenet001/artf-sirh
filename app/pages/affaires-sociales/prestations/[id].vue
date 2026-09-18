<script setup lang="ts">
import { TYPES_PIECE_PRESTATION } from "~/constants/enums";
import {
  agentNom,
  ARTICLE_PRESTATION,
  dossierClos,
  formatMontant,
  TYPE_PIECE_PRESTATION_LABEL,
  TYPE_PRESTATION_LABEL,
} from "~/constants/dossiers-sociaux";

/**
 * Fiche d'une prestation sociale : ce qui est demandé, ce que le barème CCN
 * donne, ce qui a été décidé.
 *
 * Les trois montants sont affichés séparément et jamais fusionnés. Ne montrer
 * que « le montant » laisserait croire que le calcul et la décision sont la
 * même chose — or le DG peut accorder autre chose que le calcul, et c'est
 * précisément ce qu'on doit pouvoir constater.
 */
const route = useRoute();
const api = usePrestationsApi();
const acteur = useActeurDossierSocial();
const handleError = useApiError();

const id = computed(() => Number(route.params.id));

const { data, pending, error, refresh } = useAsyncData(
  () => `prestation-${id.value}`,
  () => api.getById(id.value),
  { watch: [id] },
);
const prestation = computed(() => data.value?.data ?? null);

/**
 * Simulation du barème, avant décision. Inutile une fois le dossier clos : le
 * `calcul_snapshot` fait alors foi, et refaire tourner le barème sur des
 * paramètres qui ont pu changer donnerait un chiffre trompeur.
 */
const { data: simulationData } = useAsyncData(
  () => `prestation-simulation-${id.value}`,
  () =>
    prestation.value && !dossierClos(prestation.value.statut)
      ? api.simulation(id.value).catch(() => null)
      : Promise.resolve(null),
  { watch: [id, prestation] },
);
const simulation = computed(() => simulationData.value?.data ?? null);

const typesPiece = TYPES_PIECE_PRESTATION.map((t) => ({
  label: TYPE_PIECE_PRESTATION_LABEL[t],
  value: t,
}));

const busy = ref(false);

async function telechargerDecision() {
  busy.value = true;
  try {
    downloadBlob(await api.pdfDecision(id.value), `decision-prestation-${id.value}.pdf`);
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

/**
 * Le calcul CCN, ligne à ligne, dans l'ordre où il se déroule. On n'affiche que
 * ce qui a joué : un « 0 enfant à charge » sur une indemnité de retraite ne
 * ferait qu'égarer.
 */
const detailCalcul = computed(() => {
  const s = simulation.value;
  if (!s) return [];
  const lignes: { libelle: string; valeur: string; precision?: string }[] = [];

  if (s.base != null) {
    lignes.push({ libelle: "Traitement de base", valeur: formatMontant(s.base) });
  }
  if (s.annees_anciennete != null) {
    lignes.push({
      libelle: "Ancienneté",
      valeur: `${s.annees_anciennete} an${s.annees_anciennete > 1 ? "s" : ""}`,
      precision: s.jours_deduits
        ? `${s.jours_deduits} jours déduits (détachement, disponibilité)`
        : undefined,
    });
  }
  if (s.prime_anciennete != null) {
    lignes.push({ libelle: "Prime d'ancienneté", valeur: formatMontant(s.prime_anciennete) });
  }
  if (s.traitement_brut != null) {
    lignes.push({
      libelle: "Traitement de référence",
      valeur: formatMontant(s.traitement_brut),
      precision: "base + prime d'ancienneté",
    });
  }
  if (s.nb_mois_bareme) {
    lignes.push({
      libelle: "Nombre de mois du barème",
      valeur: `× ${s.nb_mois_bareme}`,
      precision: s.article_ccn ?? undefined,
    });
  }
  if (s.nb_enfants_a_charge) {
    lignes.push({ libelle: "Enfants à charge", valeur: String(s.nb_enfants_a_charge) });
  }
  if (s.plafond_funeraires != null && prestation.value?.type === "frais_funeraires") {
    lignes.push({
      libelle: "Plafond conventionnel",
      valeur: formatMontant(s.plafond_funeraires),
      precision: s.transport_corps ? "transport du corps compris" : undefined,
    });
  }
  return lignes;
});

/** Mois de pose en paie, écrit en toutes lettres (« septembre 2026 »). */
const moisDePaie = computed(() => {
  const p = prestation.value;
  if (!p?.paie_annee || !p?.paie_mois) return null;
  return formatMoisAnnee(`${p.paie_annee}-${String(p.paie_mois).padStart(2, "0")}-01`);
});

/** Bénéficiaire effectif : l'ayant droit enregistré, sinon le libellé libre. */
const beneficiaire = computed(() => {
  const p = prestation.value;
  if (!p) return "—";
  if (p.ayant_droit) {
    const nom = [p.ayant_droit.prenom, p.ayant_droit.nom].filter(Boolean).join(" ");
    return nom || `Ayant droit nº ${p.ayant_droit.id}`;
  }
  return p.beneficiaire_libelle || "—";
});
</script>

<template>
  <BasePanel title="Prestation sociale" subtitle="Instruction et décision (art. 119–121)">
    <template #actions>
      <UButton
        v-if="prestation && dossierClos(prestation.statut) && prestation.statut !== 'classee'"
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
      <div v-if="prestation" class="space-y-4">
        <!-- Identité du dossier -->
        <div class="rounded-xl border border-default bg-default p-5">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 class="text-lg font-semibold text-highlighted">
                {{ prestation.type_label ?? (prestation.type ? TYPE_PRESTATION_LABEL[prestation.type] : "Prestation") }}
              </h2>
              <p class="text-sm text-muted">
                {{ prestation.article_ccn ?? (prestation.type ? ARTICLE_PRESTATION[prestation.type] : "") }}
                · {{ agentNom(prestation.agent) }}
              </p>
            </div>
          </div>

          <dl class="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            <BaseInfoItem icon="i-lucide-calendar" label="Date du fait" :value="formatDateLong(prestation.date_fait)" />
            <BaseInfoItem icon="i-lucide-user-check" label="Bénéficiaire" :value="beneficiaire" />
            <BaseInfoItem
              v-if="prestation.type === 'frais_funeraires'"
              icon="i-lucide-truck"
              label="Transport du corps"
              :value="prestation.transport_corps ? 'Inclus' : 'Non inclus'"
            />
            <BaseInfoItem
              v-if="prestation.createur"
              icon="i-lucide-user-plus"
              label="Créé par"
              :value="prestation.createur.name"
            />
            <BaseInfoItem
              v-if="prestation.instructeur"
              icon="i-lucide-search"
              label="Instruit par"
              :value="prestation.instructeur.name"
            />
            <BaseInfoItem
              v-if="prestation.decideur"
              icon="i-lucide-gavel"
              label="Décidé par"
              :value="prestation.decideur.name"
            />
          </dl>
        </div>

        <!-- Montants : demandé / calculé / accordé, jamais fusionnés -->
        <div class="rounded-xl border border-default bg-default p-5">
          <BaseCardTitle icon="i-lucide-coins" title="Montants" />
          <div class="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <p class="text-xs uppercase tracking-wide text-muted">Demandé</p>
              <p class="mt-1 text-lg font-semibold tabular-nums text-highlighted">
                {{ formatMontant(prestation.montant_demande) }}
              </p>
              <p class="mt-1 text-xs text-muted">Ce que le demandeur avance.</p>
            </div>
            <div>
              <p class="text-xs uppercase tracking-wide text-muted">Barème CCN</p>
              <p class="mt-1 text-lg font-semibold tabular-nums text-highlighted">
                {{ formatMontant(prestation.montant_calcule) }}
              </p>
              <p class="mt-1 text-xs text-muted">Calculé sur le traitement et l'ancienneté.</p>
            </div>
            <div>
              <p class="text-xs uppercase tracking-wide text-muted">Accordé</p>
              <p class="mt-1 text-lg font-semibold tabular-nums text-highlighted">
                {{ formatMontant(prestation.montant_accorde) }}
              </p>
              <p class="mt-1 text-xs text-muted">
                <template v-if="moisDePaie">Posé en paie sur {{ moisDePaie }}.</template>
                <template v-else>Seul montant qui part en paie.</template>
              </p>
            </div>
          </div>

          <!--
            Le détail du calcul, et pas seulement son résultat : c'est ce qui
            permet de vérifier un montant qui surprend, et d'expliquer le refus
            d'une demande sans avoir à ouvrir la convention.
          -->
          <div
            v-if="simulation && !dossierClos(prestation.statut)"
            class="mt-5 rounded-lg border border-default bg-elevated/50 p-4"
          >
            <p class="text-xs font-medium uppercase tracking-wide text-muted">
              Comment ce montant est obtenu
            </p>
            <dl class="mt-3 space-y-2 text-sm">
              <div v-for="ligne in detailCalcul" :key="ligne.libelle" class="flex justify-between gap-4">
                <dt class="text-muted">
                  {{ ligne.libelle }}
                  <span v-if="ligne.precision" class="text-dimmed">— {{ ligne.precision }}</span>
                </dt>
                <dd class="shrink-0 tabular-nums text-toned">{{ ligne.valeur }}</dd>
              </div>
              <div
                v-if="simulation.montant != null"
                class="flex justify-between gap-4 border-t border-default pt-2 font-semibold"
              >
                <dt class="text-highlighted">Montant du barème</dt>
                <dd class="shrink-0 tabular-nums text-highlighted">{{ formatMontant(simulation.montant) }}</dd>
              </div>
            </dl>
            <p class="mt-3 text-xs text-muted">
              Estimation à la date du jour. Elle n'engage rien tant que la décision n'est pas prise —
              c'est le montant accordé qui fait foi.
            </p>
          </div>
        </div>

        <!-- Circuit -->
        <SocialCircuitDossier
          :dossier="prestation"
          :api="api"
          note-fin="Le circuit est terminé. Le PDF de décision reste téléchargeable."
          @changed="refresh"
        />

        <!-- Instruction et décision, une fois écrites -->
        <div
          v-if="prestation.notes_instruction || prestation.commentaire_decision"
          class="rounded-xl border border-default bg-default p-5"
        >
          <BaseCardTitle icon="i-lucide-file-text" title="Instruction et décision" />
          <div class="mt-4 space-y-4">
            <div v-if="prestation.notes_instruction">
              <p class="text-xs uppercase tracking-wide text-muted">Notes d'instruction</p>
              <p class="mt-1 whitespace-pre-line text-sm text-toned">{{ prestation.notes_instruction }}</p>
            </div>
            <div v-if="prestation.commentaire_decision">
              <p class="text-xs uppercase tracking-wide text-muted">
                Motif de la décision
                <span v-if="prestation.date_decision"> · {{ formatDateLong(prestation.date_decision) }}</span>
              </p>
              <p class="mt-1 whitespace-pre-line text-sm text-toned">{{ prestation.commentaire_decision }}</p>
            </div>
          </div>
        </div>

        <!-- Pièces -->
        <SocialPiecesDossier
          v-if="acteur.peutGerer || (prestation.pieces?.length ?? 0) > 0"
          :dossier="prestation"
          :api="api"
          :types="typesPiece"
          cle="prestation"
          @changed="refresh"
        />
      </div>
    </BaseDataState>
  </BasePanel>
</template>
