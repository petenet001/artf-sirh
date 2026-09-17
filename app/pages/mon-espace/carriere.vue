<script setup lang="ts">
import { structurableLabel } from "~/constants/carriere";
import { essaiOuvert, TYPE_POSITION_LABEL, type TypePosition } from "~/constants/positions";
import { TYPE_RECLASSEMENT_LABEL, type TypeReclassement } from "~/constants/reclassements";

/**
 * Ma carrière : la situation administrative du compte connecté et son
 * historique — affectations, nominations, contrats.
 *
 * Ces routes sont indexées par agent et n'exigent aucune permission : un agent
 * peut donc suivre sa propre carrière. Les positions conventionnelles et les
 * reclassements, eux, relèvent de `consulter-salaires` : ils ne s'affichent
 * qu'à qui la détient, faute de quoi l'API répondrait 403.
 */
const auth = useAuthStore();

const agentId = computed(() => auth.user?.agent_id ?? 0);
const sansAgent = computed(() => !agentId.value);
const voitRemuneration = computed(() => auth.can("consulter-salaires"));

const { synthese, pending, error } = useCarriereSynthese(agentId);

const affectationsApi = useAffectationsApi();
const nominationsApi = useNominationsApi();
const contratsApi = useContratsApi();

const { data: affectationsData } = useAsyncData(
  () => `ma-carriere-affectations-${agentId.value}`,
  () => (agentId.value ? affectationsApi.byAgent(agentId.value) : Promise.resolve(null)),
  { watch: [agentId] },
);
const affectations = computed(() => affectationsData.value?.data ?? []);

const { data: nominationsData } = useAsyncData(
  () => `ma-carriere-nominations-${agentId.value}`,
  () => (agentId.value ? nominationsApi.byAgent(agentId.value) : Promise.resolve(null)),
  { watch: [agentId] },
);
const nominations = computed(() => nominationsData.value?.data ?? []);

const { data: contratsData } = useAsyncData(
  () => `ma-carriere-contrats-${agentId.value}`,
  () => (agentId.value ? contratsApi.byAgent(agentId.value) : Promise.resolve(null)),
  { watch: [agentId] },
);
const contrats = computed(() => contratsData.value?.data ?? []);

const positionsApi = usePositionsApi();
const { data: positionsData } = useAsyncData(
  () => `ma-carriere-positions-${agentId.value}`,
  () =>
    agentId.value && voitRemuneration.value ? positionsApi.byAgent(agentId.value) : Promise.resolve(null),
  { watch: [agentId] },
);
const positions = computed(() => positionsData.value?.data ?? []);

const reclassementsApi = useReclassementsApi();
const { data: reclassementsData } = useAsyncData(
  () => `ma-carriere-reclassements-${agentId.value}`,
  () =>
    agentId.value && voitRemuneration.value ? reclassementsApi.byAgent(agentId.value) : Promise.resolve(null),
  { watch: [agentId] },
);
const reclassements = computed(() => reclassementsData.value?.data ?? []);
</script>

<template>
  <BasePanel title="Ma carrière" subtitle="Votre situation administrative et son historique">
    <template #actions>
      <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" to="/mon-espace">Retour</UButton>
    </template>

    <UAlert
      v-if="sansAgent"
      color="warning"
      variant="subtle"
      icon="i-lucide-user-x"
      title="Aucun agent rattaché à votre compte"
      description="Votre compte n'est lié à aucun dossier d'agent : aucune carrière à afficher."
    />

    <BaseDataState v-else :pending="pending" :error="error">
      <div class="space-y-6">
        <!-- Situation du jour -->
        <div class="grid gap-6 lg:grid-cols-2">
          <div class="rounded-xl border border-default bg-default p-5">
            <BaseCardTitle icon="i-lucide-building-2" title="Mon affectation" />
            <dl v-if="synthese?.affectation_active" class="mt-4 space-y-4">
              <BaseDefItem
                label="Structure"
                :value="structurableLabel(synthese.affectation_active.structurable_type)"
              />
              <BaseDefItem label="Depuis le" :value="formatDateLong(synthese.affectation_active.date_affectation)" />
            </dl>
            <p v-else class="mt-4 text-sm text-muted">Aucune affectation active.</p>
          </div>

          <div class="rounded-xl border border-default bg-default p-5">
            <BaseCardTitle icon="i-lucide-award" title="Ma nomination" />
            <dl v-if="synthese?.nomination_active" class="mt-4 space-y-4">
              <BaseDefItem label="Poste" :value="synthese.nomination_active.poste" />
              <BaseDefItem label="Depuis le" :value="formatDateLong(synthese.nomination_active.date_debut)" />
              <BaseDefItem v-if="synthese.nomination_active.essai" label="Période d'essai (art. 50)">
                <PositionsEssaiBadge :essai="synthese.nomination_active.essai" />
              </BaseDefItem>
            </dl>
            <p v-else class="mt-4 text-sm text-muted">Aucune nomination active.</p>
          </div>
        </div>

        <!-- Contrats -->
        <div class="rounded-xl border border-default bg-default p-5">
          <BaseCardTitle icon="i-lucide-file-signature" title="Mes contrats" />
          <p v-if="!contrats.length" class="mt-4 text-sm text-muted">Aucun contrat enregistré.</p>
          <ul v-else class="mt-4 space-y-3">
            <li
              v-for="c in contrats"
              :key="c.id"
              class="flex flex-wrap items-start justify-between gap-3 border-b border-default pb-3 last:border-0 last:pb-0"
            >
              <div class="min-w-0">
                <p class="text-sm text-highlighted">{{ c.type_contrat?.nom ?? "Contrat" }}</p>
                <p class="text-xs text-muted">{{ formatPeriode(c.date_debut, c.date_fin) }}</p>
              </div>
              <PositionsEssaiBadge v-if="essaiOuvert(c.essai) || c.essai?.statut === 'concluant'" :essai="c.essai" />
            </li>
          </ul>
        </div>

        <!-- Historique -->
        <div class="grid gap-6 lg:grid-cols-2">
          <div class="rounded-xl border border-default bg-default p-5">
            <BaseCardTitle icon="i-lucide-map-pin" title="Historique des affectations" />
            <p v-if="!affectations.length" class="mt-4 text-sm text-muted">Aucune affectation.</p>
            <ul v-else class="mt-4 space-y-3">
              <li v-for="a in affectations" :key="a.id" class="border-b border-default pb-3 last:border-0 last:pb-0">
                <p class="text-sm text-highlighted">{{ structurableLabel(a.structurable_type) }}</p>
                <p class="text-xs text-muted">
                  {{ formatPeriode(a.date_affectation, a.date_fin) }}
                  <span v-if="a.statut_label"> · {{ a.statut_label }}</span>
                </p>
              </li>
            </ul>
          </div>

          <div class="rounded-xl border border-default bg-default p-5">
            <BaseCardTitle icon="i-lucide-award" title="Historique des nominations" />
            <p v-if="!nominations.length" class="mt-4 text-sm text-muted">Aucune nomination.</p>
            <ul v-else class="mt-4 space-y-3">
              <li v-for="n in nominations" :key="n.id" class="border-b border-default pb-3 last:border-0 last:pb-0">
                <p class="text-sm text-highlighted">{{ n.poste ?? "Poste" }}</p>
                <p class="text-xs text-muted">
                  {{ formatPeriode(n.date_debut, n.date_fin) }}
                  <span v-if="n.statut_label"> · {{ n.statut_label }}</span>
                </p>
              </li>
            </ul>
          </div>
        </div>

        <!-- Positions et reclassements : réservés à qui consulte les salaires -->
        <div v-if="voitRemuneration" class="grid gap-6 lg:grid-cols-2">
          <div class="rounded-xl border border-default bg-default p-5">
            <BaseCardTitle icon="i-lucide-user-cog" title="Mes positions (art. 76–80)" />
            <p v-if="!positions.length" class="mt-4 text-sm text-muted">Aucune position conventionnelle.</p>
            <ul v-else class="mt-4 space-y-3">
              <li
                v-for="p in positions"
                :key="p.id"
                class="flex items-start justify-between gap-3 border-b border-default pb-3 last:border-0 last:pb-0"
              >
                <div class="min-w-0">
                  <p class="text-sm text-highlighted">
                    {{ p.type_label ?? TYPE_POSITION_LABEL[p.type as TypePosition] }}
                  </p>
                  <p class="text-xs text-muted">{{ formatPeriode(p.date_debut, p.date_fin) }}</p>
                </div>
                <PositionsStatutBadge :statut="p.statut" :label="p.statut_label" />
              </li>
            </ul>
          </div>

          <div class="rounded-xl border border-default bg-default p-5">
            <BaseCardTitle icon="i-lucide-arrow-up-narrow-wide" title="Mes reclassements (art. 73–75)" />
            <p v-if="!reclassements.length" class="mt-4 text-sm text-muted">Aucun reclassement.</p>
            <ul v-else class="mt-4 space-y-3">
              <li
                v-for="r in reclassements"
                :key="r.id"
                class="flex items-start justify-between gap-3 border-b border-default pb-3 last:border-0 last:pb-0"
              >
                <div class="min-w-0">
                  <p class="text-sm text-highlighted">
                    {{ r.type_label ?? TYPE_RECLASSEMENT_LABEL[r.type as TypeReclassement] }}
                  </p>
                  <p class="text-xs text-muted">{{ formatDate(r.created_at) }}</p>
                </div>
                <ReclassementsStatutBadge :statut="r.statut" :label="r.statut_label" />
              </li>
            </ul>
          </div>
        </div>
      </div>
    </BaseDataState>
  </BasePanel>
</template>
