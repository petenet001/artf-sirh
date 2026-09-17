<script setup lang="ts">
import {
  agentNom,
  ETAPE_RECLASSEMENT_LABEL,
  MOTIF_RECONVERSION_LABEL,
  peutApprouver,
  TYPE_RECLASSEMENT_LABEL,
  type EtapeReclassement,
  type MotifReconversion,
  type TypeReclassement,
} from "~/constants/reclassements";

/**
 * Détail d'un dossier de reclassement : contexte calculé par l'API (âge,
 * ancienneté, années dans la classe, échelons), verdict d'éligibilité, et les
 * deux actes du circuit — approbation puis application.
 *
 * Qui approuve dépend de l'article : la RH pour l'art. 73, le DG pour les
 * art. 74 et 75 (403 sinon). L'application relève de `gerer-salaires` et est
 * idempotente (`meta.applique` dit si la classe a réellement changé).
 */
const route = useRoute();
const id = computed(() => Number(route.params.id));

const api = useReclassementsApi();
const auth = useAuthStore();
const toast = useToast();
const handleError = useApiError();

const { data, pending, error, refresh } = useAsyncData(
  () => `reclassement-${id.value}`,
  () => (id.value > 0 ? api.getById(id.value) : Promise.resolve(null)),
  { watch: [id] },
);
const dossier = computed(() => data.value?.data ?? null);

const acteur = computed(() => ({
  estRh: auth.hasRole("rh"),
  estDg: auth.hasRole("directeur-general"),
  estAdmin: auth.hasRole("admin"),
}));

const approbateur = computed(
  () => !!dossier.value && peutApprouver(dossier.value.type as TypeReclassement, acteur.value),
);
const aApprouver = computed(() => dossier.value?.prochaine_etape === "approuver" && approbateur.value);
const aAppliquer = computed(
  () => dossier.value?.prochaine_etape === "appliquer" && auth.can("gerer-salaires"),
);

const busy = ref(false);
const rejetOpen = ref(false);
const commentaire = ref("");

async function executer(fn: () => Promise<unknown>, message: string) {
  busy.value = true;
  try {
    await fn();
    toast.add({ title: message, color: "success" });
    rejetOpen.value = false;
    await refresh();
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

function approuver() {
  executer(() => api.approuver(id.value), "Reclassement approuvé");
}

function rejeter() {
  executer(
    () => api.rejeter(id.value, { commentaire: commentaire.value.trim() || null }),
    "Reclassement rejeté",
  );
}

async function appliquer() {
  busy.value = true;
  try {
    const reponse = await api.appliquer(id.value);
    toast.add({
      title: reponse.message ?? "Reclassement appliqué",
      color: reponse.meta?.applique === false ? "neutral" : "success",
    });
    await refresh();
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <BasePanel title="Dossier de reclassement" subtitle="Articles 73 à 75 de la convention collective">
    <template #actions>
      <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" to="/carriere/reclassements">Retour</UButton>
    </template>

    <BaseDataState :pending="pending" :error="error" :empty="!dossier" empty-label="Dossier introuvable">
      <div v-if="dossier" class="space-y-6">
        <!-- En-tête -->
        <div class="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-default bg-default p-5">
          <div class="min-w-0">
            <p class="text-lg font-semibold text-highlighted">{{ agentNom(dossier.agent) }}</p>
            <p class="text-sm text-muted">
              {{ dossier.type_label ?? TYPE_RECLASSEMENT_LABEL[dossier.type as TypeReclassement] }}
            </p>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <ReclassementsStatutBadge :statut="dossier.statut" :label="dossier.statut_label" />
              <UBadge v-if="dossier.prochaine_etape" color="neutral" variant="outline" size="sm">
                {{ ETAPE_RECLASSEMENT_LABEL[dossier.prochaine_etape as EtapeReclassement] }}
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
            <UButton v-if="aAppliquer" icon="i-lucide-check-check" :loading="busy" @click="appliquer">
              Appliquer le reclassement
            </UButton>
          </div>
        </div>

        <!-- Éligibilité : verdict serveur, présent sur le show seulement -->
        <UAlert
          v-if="dossier.eligibilite"
          :color="dossier.eligibilite.ok ? 'success' : 'warning'"
          variant="subtle"
          :icon="dossier.eligibilite.ok ? 'i-lucide-badge-check' : 'i-lucide-alert-triangle'"
          :title="dossier.eligibilite.ok ? 'Conditions réglementaires réunies' : 'Conditions non réunies'"
        >
          <template v-if="dossier.eligibilite.messages?.length" #description>
            <ul class="list-disc space-y-1 pl-4">
              <li v-for="(message, i) in dossier.eligibilite.messages" :key="i">{{ message }}</li>
            </ul>
          </template>
        </UAlert>

        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <!-- Mouvement de classe -->
          <div class="rounded-xl border border-default bg-default p-5">
            <BaseCardTitle icon="i-lucide-arrow-up-narrow-wide" title="Mouvement" />
            <dl class="mt-4 grid gap-x-10 gap-y-4 sm:grid-cols-2">
              <BaseDefItem
                label="Classe d'origine"
                :value="[dossier.classe_origine?.categorie, dossier.classe_origine?.grade].filter(Boolean).join(' · ') || null"
              />
              <BaseDefItem
                label="Classe cible"
                :value="[dossier.classe_cible?.categorie, dossier.classe_cible?.grade].filter(Boolean).join(' · ') || null"
              />
              <BaseDefItem
                label="Échelon d'origine"
                :value="dossier.echelon_origine != null ? String(dossier.echelon_origine) : null"
              />
              <BaseDefItem
                label="Échelon cible"
                :value="dossier.echelon_cible != null ? String(dossier.echelon_cible) : null"
              />
              <BaseDefItem label="Diplôme invoqué" :value="dossier.diplome?.nom" />
              <BaseDefItem label="Fonction de reconversion" :value="dossier.fonction_cible?.nom" />
              <BaseDefItem
                v-if="dossier.motif_reconversion"
                label="Motif réglementaire"
                :value="MOTIF_RECONVERSION_LABEL[dossier.motif_reconversion as MotifReconversion]"
              />
              <BaseDefItem label="Pièce justificative" :value="dossier.piece_path" />
              <BaseDefItem label="Motif" :value="dossier.motif" class="sm:col-span-2" />
            </dl>
          </div>

          <!-- Contexte de l'agent -->
          <div class="rounded-xl border border-default bg-default p-5">
            <BaseCardTitle icon="i-lucide-user-round" title="Situation de l'agent" />
            <dl class="mt-4 space-y-4">
              <BaseDefItem label="Âge" :value="dossier.age_ans != null ? `${dossier.age_ans} ans` : null" />
              <BaseDefItem
                label="Ancienneté"
                :value="dossier.anciennete_ans != null ? `${dossier.anciennete_ans} ans` : null"
              />
              <BaseDefItem
                label="Années dans la classe"
                :value="dossier.annees_dans_classe != null ? `${dossier.annees_dans_classe} ans` : null"
              />
              <BaseDefItem label="Approuvé le" :value="formatDateTime(dossier.valide_at)" />
              <BaseDefItem label="Appliqué le" :value="formatDateTime(dossier.applique_at)" />
            </dl>
          </div>
        </div>
      </div>
    </BaseDataState>

    <UModal v-model:open="rejetOpen" title="Rejeter le reclassement">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Commentaire" name="commentaire">
            <UTextarea v-model="commentaire" :rows="4" placeholder="Motif du rejet (facultatif)" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="rejetOpen = false">Annuler</UButton>
            <UButton color="error" :loading="busy" @click="rejeter">Rejeter</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </BasePanel>
</template>
