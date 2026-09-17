<script setup lang="ts">
import type { PlanFormation } from "~/schemas/plan-formation";
import { planModifiable, prochaineEtapePlan } from "~/constants/formations";

/**
 * Plan annuel de formation (CCN art. 92). Une année, un plan : il se remplit en
 * brouillon, se valide (refusé sans ligne), s'exécute puis se clôture — et il
 * n'est plus modifiable dès qu'il quitte le brouillon.
 */
const api = useFormationsApi();
const auth = useAuthStore();
const toast = useToast();
const handleError = useApiError();

const peutGerer = computed(() => auth.can("gerer-formations"));

const { data, pending, error, refresh } = useAsyncData("plans-formation", () => api.plans());
const plans = computed(() => data.value?.data ?? []);

// Plan sélectionné : le plus récent par défaut.
const planId = ref<number>(0);
watchEffect(() => {
  if (!planId.value && plans.value.length) planId.value = plans.value[0]!.id;
});
const planOptions = computed(() =>
  plans.value.map((p) => ({ label: `${p.annee}${p.titre ? ` — ${p.titre}` : ""}`, value: p.id })),
);

const { data: planData, refresh: refreshPlan } = useAsyncData(
  () => `plan-formation-${planId.value}`,
  () => (planId.value > 0 ? api.plan(planId.value) : Promise.resolve(null)),
  { watch: [planId] },
);
const plan = computed<PlanFormation | null>(() => planData.value?.data ?? null);
const lignes = computed(() => plan.value?.lignes ?? []);
const etape = computed(() => prochaineEtapePlan(plan.value?.statut));
const modifiable = computed(() => planModifiable(plan.value?.statut));

const { data: catalogueData } = useAsyncData("plan-catalogue", () => api.catalogue({ actif: true }));
const formationOptions = computed(() =>
  (catalogueData.value?.data ?? []).map((f) => ({ label: f.titre, value: f.id })),
);

const busy = ref(false);

async function executer(fn: () => Promise<unknown>, message: string) {
  busy.value = true;
  try {
    await fn();
    toast.add({ title: message, color: "success" });
    await Promise.all([refresh(), refreshPlan()]);
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

function avancer() {
  const e = etape.value;
  if (!e || !plan.value) return;
  const id = plan.value.id;
  const actions = {
    valider: () => api.validerPlan(id),
    executer: () => api.executerPlan(id),
    cloturer: () => api.cloturerPlan(id),
  } as const;
  executer(actions[e.key], `Plan ${e.key === "valider" ? "validé" : e.key === "executer" ? "en exécution" : "clôturé"}`);
}

// — Création d'un plan ————————————————————————————————————————
const planOpen = ref(false);
const annee = ref<number>(new Date().getFullYear());
const titre = ref("");

function creerPlan() {
  executer(
    () => api.creerPlan({ annee: annee.value, titre: titre.value.trim() || null }),
    "Plan créé",
  ).then(() => {
    planOpen.value = false;
  });
}

// — Lignes du plan ————————————————————————————————————————————
const ligneOpen = ref(false);
const formationId = ref<number | undefined>(undefined);
const places = ref<number>(1);

function ajouterLigne() {
  if (!plan.value || !formationId.value) {
    toast.add({ title: "Sélectionner une formation.", color: "error" });
    return;
  }
  executer(
    () => api.ajouterLigne(plan.value!.id, { formation_id: formationId.value!, places_prevues: places.value }),
    "Formation ajoutée au plan",
  ).then(() => {
    ligneOpen.value = false;
  });
}

function retirerLigne(ligneId: number) {
  if (!plan.value) return;
  executer(() => api.retirerLigne(plan.value!.id, ligneId), "Formation retirée du plan");
}
</script>

<template>
  <BasePanel title="Plan annuel de formation" subtitle="Brouillon → validé → exécuté → clôturé">
    <BaseDataState :pending="pending" :error="error">
      <div class="space-y-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <USelect
            v-model="planId"
            :items="planOptions"
            value-key="value"
            placeholder="Choisir un plan"
            class="w-72"
          />
          <div class="flex items-center gap-2">
            <UButton v-if="peutGerer" color="neutral" variant="soft" icon="i-lucide-plus" @click="planOpen = true">
              Nouveau plan
            </UButton>
            <UButton v-if="peutGerer && etape" :icon="etape.icon" :loading="busy" @click="avancer">
              {{ etape.label }}
            </UButton>
          </div>
        </div>

        <div v-if="plan" class="space-y-6">
          <div class="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-default bg-default p-5">
            <div class="min-w-0">
              <p class="text-lg font-semibold text-highlighted">
                Plan {{ plan.annee }}{{ plan.titre ? ` — ${plan.titre}` : "" }}
              </p>
              <p class="text-sm text-muted">
                {{ lignes.length }} formation(s) inscrite(s) au plan
                <span v-if="plan.valide_at"> · validé le {{ formatDate(plan.valide_at) }}</span>
              </p>
            </div>
            <FormationsStatutPlanBadge :statut="plan.statut" :label="plan.statut_label" />
          </div>

          <div class="rounded-xl border border-default bg-default p-5">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <BaseCardTitle icon="i-lucide-list" title="Formations prévues" />
              <UButton
                v-if="peutGerer && modifiable"
                size="xs"
                color="neutral"
                variant="soft"
                icon="i-lucide-plus"
                @click="ligneOpen = true"
              >
                Ajouter
              </UButton>
            </div>

            <p v-if="!lignes.length" class="mt-4 text-sm text-muted">
              Aucune formation au plan. La validation est refusée tant qu'il est vide.
            </p>
            <ul v-else class="mt-4 space-y-3">
              <li
                v-for="ligne in lignes"
                :key="ligne.id"
                class="flex items-start justify-between gap-3 border-b border-default pb-3 last:border-0 last:pb-0"
              >
                <div class="min-w-0">
                  <p class="text-sm text-highlighted">{{ ligne.formation?.titre ?? `Formation #${ligne.formation_id}` }}</p>
                  <p class="text-xs text-muted">
                    {{ ligne.places_prevues ?? 0 }} place(s) prévue(s)
                    <span v-if="ligne.formation?.organisme"> · {{ ligne.formation.organisme }}</span>
                  </p>
                </div>
                <UButton
                  v-if="peutGerer && modifiable"
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-trash-2"
                  :loading="busy"
                  @click="retirerLigne(ligne.id)"
                />
              </li>
            </ul>
          </div>
        </div>

        <p v-else class="text-sm text-muted">Aucun plan de formation. Créez celui de l'année.</p>
      </div>
    </BaseDataState>

    <UModal v-model:open="planOpen" title="Nouveau plan annuel">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Année" name="annee" required help="Une seule plan par année.">
            <UInputNumber v-model="annee" :min="2020" :max="2100" class="w-full" />
          </UFormField>
          <UFormField label="Titre" name="titre">
            <UInput v-model="titre" placeholder="Ex. Plan de formation 2026" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="planOpen = false">Annuler</UButton>
            <UButton :loading="busy" @click="creerPlan">Créer</UButton>
          </div>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="ligneOpen" title="Ajouter une formation au plan">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Formation" name="formation_id" required>
            <USelectMenu v-model="formationId" :items="formationOptions" value-key="value" class="w-full" />
          </UFormField>
          <UFormField label="Places prévues" name="places_prevues">
            <UInputNumber v-model="places" :min="1" :max="500" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="ligneOpen = false">Annuler</UButton>
            <UButton :loading="busy" @click="ajouterLigne">Ajouter</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </BasePanel>
</template>
