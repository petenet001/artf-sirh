<script setup lang="ts">
import {
  agentNom,
  EFFET_POSITION,
  ETAPE_POSITION_LABEL,
  TYPE_POSITION_LABEL,
  type EtapePosition,
  type TypePosition,
} from "~/constants/positions";

/**
 * Détail d'une position conventionnelle et son circuit : approbation par le
 * **DG** (403 pour quiconque d'autre), clôture et renouvellement.
 *
 * À la clôture d'un détachement, l'API signale
 * `reintegration.affectation_manquante` : l'agent revient sans emploi et doit
 * être réaffecté dans sa classe (art. 78) — rien n'est créé automatiquement.
 */
const route = useRoute();
const id = computed(() => Number(route.params.id));

const api = usePositionsApi();
const auth = useAuthStore();
const toast = useToast();
const handleError = useApiError();

const { data, pending, error, refresh } = useAsyncData(
  () => `position-${id.value}`,
  () => (id.value > 0 ? api.getById(id.value) : Promise.resolve(null)),
  { watch: [id] },
);
const position = computed(() => data.value?.data ?? null);

const estDg = computed(() => auth.hasRole("directeur-general") || auth.hasRole("admin"));
const peutGerer = computed(() => auth.can("gerer-salaires"));

const aApprouver = computed(() => position.value?.prochaine_etape === "approuver" && estDg.value);
const aCloturer = computed(() => position.value?.prochaine_etape === "cloturer" && peutGerer.value);
const aRenouveler = computed(() => !!position.value?.peut_renouveler && estDg.value);

const busy = ref(false);
const rejetOpen = ref(false);
const clotureOpen = ref(false);
const renouvellementOpen = ref(false);
const commentaire = ref("");
const dateFin = ref<string | undefined>(undefined);
const nouveauDebut = ref<string | undefined>(undefined);
const nouvelleFin = ref<string | undefined>(undefined);

async function executer(fn: () => Promise<unknown>, message: string) {
  busy.value = true;
  try {
    await fn();
    toast.add({ title: message, color: "success" });
    rejetOpen.value = false;
    clotureOpen.value = false;
    renouvellementOpen.value = false;
    await refresh();
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

function approuver() {
  executer(() => api.approuver(id.value), "Position approuvée — effets appliqués");
}

function rejeter() {
  executer(() => api.rejeter(id.value, { commentaire: commentaire.value.trim() || null }), "Position rejetée");
}

function cloturer() {
  executer(
    () => api.cloturer(id.value, { date_fin: dateFin.value || null, commentaire: commentaire.value.trim() || null }),
    "Position clôturée",
  );
}

function renouveler() {
  if (!nouveauDebut.value || !nouvelleFin.value) {
    toast.add({ title: "Nouvelle période requise.", color: "error" });
    return;
  }
  executer(
    () => api.renouveler(id.value, { date_debut: nouveauDebut.value!, date_fin: nouvelleFin.value! }),
    "Position renouvelée",
  );
}
</script>

<template>
  <BasePanel title="Position conventionnelle" subtitle="Circuit RH → Directeur Général (art. 76–80)">
    <template #actions>
      <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" to="/carriere/positions">Retour</UButton>
    </template>

    <BaseDataState :pending="pending" :error="error" :empty="!position" empty-label="Position introuvable">
      <div v-if="position" class="space-y-6">
        <div class="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-default bg-default p-5">
          <div class="min-w-0">
            <p class="text-lg font-semibold text-highlighted">{{ agentNom(position.agent) }}</p>
            <p class="text-sm text-muted">
              {{ position.type_label ?? TYPE_POSITION_LABEL[position.type as TypePosition] }}
              · {{ formatPeriode(position.date_debut, position.date_fin) }}
            </p>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <PositionsStatutBadge :statut="position.statut" :label="position.statut_label" />
              <UBadge v-if="position.prochaine_etape" color="neutral" variant="outline" size="sm">
                {{ ETAPE_POSITION_LABEL[position.prochaine_etape as EtapePosition] }}
              </UBadge>
              <UBadge v-if="position.nb_renouvellements" color="neutral" variant="outline" size="sm">
                {{ position.nb_renouvellements }} renouvellement(s)
              </UBadge>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-end gap-2">
            <template v-if="aApprouver">
              <UButton icon="i-lucide-check" color="success" :loading="busy" @click="approuver">Approuver</UButton>
              <UButton icon="i-lucide-x" color="error" variant="soft" :loading="busy" @click="rejetOpen = true">
                Rejeter
              </UButton>
            </template>
            <UButton v-if="aRenouveler" icon="i-lucide-repeat" variant="soft" :loading="busy" @click="renouvellementOpen = true">
              Renouveler
            </UButton>
            <UButton v-if="aCloturer" icon="i-lucide-square-check" :loading="busy" @click="clotureOpen = true">
              Clôturer
            </UButton>
          </div>
        </div>

        <UAlert
          color="warning"
          variant="subtle"
          icon="i-lucide-alert-triangle"
          title="Effets de la position"
          :description="EFFET_POSITION[position.type as TypePosition]"
        />

        <UAlert
          v-if="position.reintegration?.affectation_manquante"
          color="error"
          variant="subtle"
          icon="i-lucide-user-x"
          title="Réintégration à organiser"
          description="L'agent revient sans affectation active : lui attribuer un emploi de sa classe (art. 78)."
        />

        <div class="rounded-xl border border-default bg-default p-5">
          <BaseCardTitle icon="i-lucide-file-text" title="Détail" />
          <dl class="mt-4 grid gap-x-10 gap-y-4 sm:grid-cols-2">
            <BaseDefItem label="Organisme d'accueil" :value="position.organisme_accueil" />
            <BaseDefItem label="Consentement de l'agent" :value="position.consentement_agent ? 'Recueilli' : 'Non recueilli'" />
            <BaseDefItem
              v-if="position.type === 'detachement'"
              label="Détachement d'office"
              :value="position.detachement_office ? 'Oui' : 'Non'"
            />
            <BaseDefItem label="Pièce justificative" :value="position.piece_path" />
            <BaseDefItem label="Commentaire" :value="position.commentaire" class="sm:col-span-2" />
          </dl>
        </div>
      </div>
    </BaseDataState>

    <UModal v-model:open="rejetOpen" title="Rejeter la position">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Commentaire" name="commentaire">
            <UTextarea v-model="commentaire" :rows="4" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="rejetOpen = false">Annuler</UButton>
            <UButton color="error" :loading="busy" @click="rejeter">Rejeter</UButton>
          </div>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="clotureOpen" title="Clôturer la position">
      <template #body>
        <div class="space-y-4">
          <p class="text-sm text-muted">
            Un détachement ou une disponibilité suppose un préavis de trois mois.
          </p>
          <UFormField label="Date de fin effective" name="date_fin">
            <UInput v-model="dateFin" type="date" class="w-full" />
          </UFormField>
          <UFormField label="Commentaire" name="commentaire">
            <UTextarea v-model="commentaire" :rows="3" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="clotureOpen = false">Annuler</UButton>
            <UButton :loading="busy" @click="cloturer">Clôturer</UButton>
          </div>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="renouvellementOpen" title="Renouveler la position">
      <template #body>
        <div class="space-y-4">
          <p class="text-sm text-muted">
            La disponibilité n'est renouvelable que deux fois (art. 79).
          </p>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Du" name="date_debut" required>
              <UInput v-model="nouveauDebut" type="date" class="w-full" />
            </UFormField>
            <UFormField label="Au" name="date_fin" required>
              <UInput v-model="nouvelleFin" type="date" class="w-full" />
            </UFormField>
          </div>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="renouvellementOpen = false">Annuler</UButton>
            <UButton :loading="busy" @click="renouveler">Renouveler</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </BasePanel>
</template>
