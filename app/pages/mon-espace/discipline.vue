<script setup lang="ts">
import { STATUT_SANCTION_LABEL, type StatutSanction } from "~/constants/discipline";

/**
 * Espace disciplinaire de l'agent (self-service). Aucune permission n'est
 * requise : il suffit que le compte porte un `agent_id` — l'API répond 403
 * sinon, et 404 pour le dossier d'un autre agent.
 *
 * `notes_instruction` n'est pas renvoyé ici (réservé à la RH) : l'agent voit
 * les faits, la décision et peut télécharger sa décision une fois prononcée.
 */
const auth = useAuthStore();
const api = useSanctionsApi();
const handleError = useApiError();

const sansAgent = computed(() => !auth.user?.agent_id);

const { data, pending, error } = useAsyncData("mon-historique-discipline", () =>
  sansAgent.value ? Promise.resolve(null) : api.monHistorique(),
);
const historique = computed(() => data.value?.data ?? null);
const sanctions = computed(() => historique.value?.sanctions ?? []);
const avertissements = computed(() => historique.value?.avertissements ?? []);

const busy = ref(false);
async function telechargerDecision(id: number) {
  busy.value = true;
  try {
    downloadBlob(await api.maDecisionPdf(id), `decision-disciplinaire-${id}.pdf`);
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <BasePanel title="Mon dossier disciplinaire" subtitle="Sanctions et avertissements vous concernant">
    <template #actions>
      <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" to="/mon-espace">Retour</UButton>
    </template>

    <UAlert
      v-if="sansAgent"
      color="warning"
      variant="subtle"
      icon="i-lucide-user-x"
      title="Aucun agent rattaché à votre compte"
      description="Votre compte n'est lié à aucun dossier d'agent : rien à afficher ici."
    />

    <BaseDataState v-else :pending="pending" :error="error">
      <div class="space-y-6">
        <UAlert
          v-if="historique?.recidive"
          color="warning"
          variant="subtle"
          icon="i-lucide-alert-triangle"
          title="Antécédent disciplinaire"
          description="Une sanction prononcée figure à votre dossier sur les cinq dernières années."
        />

        <div class="rounded-xl border border-default bg-default p-5">
          <BaseCardTitle icon="i-lucide-shield-alert" title="Sanctions" />
          <p v-if="!sanctions.length" class="mt-4 text-sm text-muted">Aucune sanction à votre dossier.</p>
          <ul v-else class="mt-4 space-y-4">
            <li v-for="s in sanctions" :key="s.id" class="border-b border-default pb-4 last:border-0 last:pb-0">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-sm font-medium text-highlighted">{{ s.type_sanction?.nom ?? "Sanction" }}</p>
                  <p class="text-xs text-muted">
                    Faits du {{ formatDate(s.date_faits) }}
                    <span v-if="s.date_decision"> · prononcée le {{ formatDate(s.date_decision) }}</span>
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <DisciplineStatutBadge
                    :statut="s.statut"
                    :label="s.statut_label ?? STATUT_SANCTION_LABEL[s.statut as StatutSanction]"
                  />
                  <UButton
                    v-if="s.statut === 'validee'"
                    size="xs"
                    color="neutral"
                    variant="soft"
                    icon="i-lucide-file-down"
                    :loading="busy"
                    @click="telechargerDecision(s.id)"
                  >
                    Décision
                  </UButton>
                </div>
              </div>
              <p v-if="s.motif" class="mt-2 text-sm text-default">{{ s.motif }}</p>
              <p v-if="s.date_debut_effet" class="mt-1 text-xs text-muted">
                Effet du {{ formatDate(s.date_debut_effet) }} au {{ formatDate(s.date_fin_effet) }}
              </p>
            </li>
          </ul>
        </div>

        <div class="rounded-xl border border-default bg-default p-5">
          <BaseCardTitle icon="i-lucide-message-square-warning" title="Avertissements" />
          <p v-if="!avertissements.length" class="mt-4 text-sm text-muted">Aucun avertissement.</p>
          <ul v-else class="mt-4 space-y-3">
            <li v-for="a in avertissements" :key="a.id" class="border-b border-default pb-3 last:border-0 last:pb-0">
              <p class="text-xs text-muted">{{ formatDate(a.date) }}</p>
              <p class="mt-1 text-sm text-default">{{ a.motif }}</p>
            </li>
          </ul>
        </div>
      </div>
    </BaseDataState>
  </BasePanel>
</template>
