<script setup lang="ts">
import { agentNom, structurableLabel } from "~/constants/carriere";

// Boîte de réception des validations. L'API n'expose pas de liste globale : on
// agrège les entités à un statut « en attente de circuit » — dossiers
// d'intégration, affectations et nominations. Chaque item ouvre son détail où
// se prend la décision (approuver / rejeter par niveau).
const dossiersApi = useDossiersApi();
const affectationsApi = useAffectationsApi();
const nominationsApi = useNominationsApi();

const { data, pending, error } = useAsyncData("validations-inbox", async () => {
  const [valideRh, attenteDg, affs, noms] = await Promise.all([
    dossiersApi.list({ statut: "VALIDE_RH" }),
    dossiersApi.list({ statut: "EN_ATTENTE_DG" }),
    affectationsApi.list({ statut: "en_attente_validation" }),
    nominationsApi.list({ statut: "en_attente" }),
  ]);
  return {
    dossiers: [...valideRh.data, ...attenteDg.data],
    affectations: affs.data,
    nominations: noms.data,
  };
});

const dossiers = computed(() => data.value?.dossiers ?? []);
const affectations = computed(() => data.value?.affectations ?? []);
const nominations = computed(() => data.value?.nominations ?? []);
const vide = computed(
  () => !dossiers.value.length && !affectations.value.length && !nominations.value.length,
);
</script>

<template>
  <BasePanel title="Mes validations" subtitle="Dossiers, affectations et nominations en attente de décision">
    <BaseDataState :pending="pending" :error="error" :empty="vide" empty-label="Rien à valider">
      <div class="space-y-6">
        <!-- Dossiers d'intégration -->
        <section v-if="dossiers.length" class="space-y-2">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-muted">Dossiers d'intégration</h3>
          <ULink
            v-for="d in dossiers"
            :key="`d-${d.id}`"
            :to="`/integration/dossiers/${d.id}`"
            class="flex items-center gap-3 rounded-lg border border-default bg-default p-3 transition-colors hover:bg-elevated/40"
          >
            <UIcon name="i-lucide-folder-open" class="size-5 shrink-0 text-primary" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-highlighted">{{ d.reference }}</p>
              <p class="truncate text-xs text-muted">
                {{ d.agent?.nom_complet ?? "Agent" }} · {{ d.type_integration?.nom }}
              </p>
            </div>
            <IntegrationStatutBadge :statut="d.statut" :label="d.statut_label" />
            <UIcon name="i-lucide-chevron-right" class="size-4 shrink-0 text-muted" />
          </ULink>
        </section>

        <!-- Affectations -->
        <section v-if="affectations.length" class="space-y-2">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-muted">Affectations</h3>
          <ULink
            v-for="a in affectations"
            :key="`a-${a.id}`"
            :to="`/carriere/affectations/${a.id}`"
            class="flex items-center gap-3 rounded-lg border border-default bg-default p-3 transition-colors hover:bg-elevated/40"
          >
            <UIcon name="i-lucide-map-pin" class="size-5 shrink-0 text-primary" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-highlighted">{{ agentNom(a.agent) }}</p>
              <p class="truncate text-xs text-muted">{{ structurableLabel(a.structurable_type) }}</p>
            </div>
            <CarriereStatutBadge :statut="a.statut" :label="a.statut_label" />
            <UIcon name="i-lucide-chevron-right" class="size-4 shrink-0 text-muted" />
          </ULink>
        </section>

        <!-- Nominations -->
        <section v-if="nominations.length" class="space-y-2">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-muted">Nominations</h3>
          <ULink
            v-for="n in nominations"
            :key="`n-${n.id}`"
            :to="`/carriere/nominations/${n.id}`"
            class="flex items-center gap-3 rounded-lg border border-default bg-default p-3 transition-colors hover:bg-elevated/40"
          >
            <UIcon name="i-lucide-award" class="size-5 shrink-0 text-primary" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-highlighted">{{ agentNom(n.agent) }}</p>
              <p class="truncate text-xs text-muted">
                {{ n.poste ?? "—" }} · {{ n.structure?.nom ?? structurableLabel(n.structurable_type) }}
              </p>
            </div>
            <CarriereStatutBadge :statut="n.statut" :label="n.statut_label" />
            <UIcon name="i-lucide-chevron-right" class="size-4 shrink-0 text-muted" />
          </ULink>
        </section>
      </div>
    </BaseDataState>
  </BasePanel>
</template>
