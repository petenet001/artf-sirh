<script setup lang="ts">
import type { STRUCTURABLE_TYPES } from "~/constants/enums";
import { structurableLabel, agentNom } from "~/constants/carriere";
import { essaiOuvert } from "~/constants/positions";
import { POSTES_NOMINATION, TYPES_ACTE_NOMINATION, type NominationUpdate } from "~/schemas/nomination";

/**
 * Détail d'une nomination : identité, circuit de validation et action
 * principale selon le statut. Née `en_attente`, elle devient `approuvee` en fin
 * de circuit, puis `active` ; active, elle peut être clôturée. L'acte PDF est
 * téléchargeable une fois la nomination décidée.
 */
const route = useRoute();
const id = computed(() => Number(route.params.id));

const nominationsApi = useNominationsApi();
const toast = useToast();
const handleError = useApiError();

const { data, pending, error, refresh } = useAsyncData(
  () => `nomination-${id.value}`,
  () => (id.value > 0 ? nominationsApi.getById(id.value) : Promise.resolve(null)),
  { watch: [id] },
);
const nomination = computed(() => data.value?.data ?? null);
const statut = computed(() => nomination.value?.statut ?? "");

const busy = ref(false);
async function action(fn: () => Promise<unknown>, ok: string) {
  busy.value = true;
  try {
    await fn();
    toast.add({ title: ok, color: "success" });
    await refresh();
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}
const activer = () => action(() => nominationsApi.activer(id.value), "Nomination activée");
const cloturer = () => action(() => nominationsApi.cloturer(id.value), "Nomination clôturée");
const rejeter = () => action(() => nominationsApi.rejeter(id.value), "Nomination rejetée");

// — Essai sur emploi supérieur (CCN art. 50) —————————————————————
// L'essai n'existe que si la nomination y était soumise ; sa rupture ramène
// l'agent à son emploi précédent (`nomination_precedente_id`).
const essai = computed(() => nomination.value?.essai);
const essaiEnCours = computed(() => essaiOuvert(essai.value));
const confirmerEssai = () =>
  action(() => nominationsApi.confirmerEssai(id.value), "Essai confirmé — nomination définitive");
const rompreEssai = () => {
  if (!confirm("Rompre l'essai ? L'agent retrouve son emploi précédent.")) return;
  return action(() => nominationsApi.rompreEssai(id.value), "Essai rompu");
};

const peutRejeter = computed(() => ["en_attente", "approuvee"].includes(statut.value));
const peutActe = computed(() => !["en_attente"].includes(statut.value));
const peutModifier = computed(() => statut.value === "en_attente");

// — Édition (uniquement tant que `en_attente`) ————————————————————
const posteItems = POSTES_NOMINATION.map((p) => ({ label: p, value: p }));
const acteItems = TYPES_ACTE_NOMINATION.map((t) => ({ label: t, value: t }));
const editOpen = ref(false);
const form = reactive<{
  poste?: (typeof POSTES_NOMINATION)[number];
  structurable_type: (typeof STRUCTURABLE_TYPES)[number];
  structurable_id?: number;
  date_debut: string;
  type_acte?: (typeof TYPES_ACTE_NOMINATION)[number];
}>({ structurable_type: "App\\Models\\Bureau", date_debut: "" });

function openEdit() {
  const n = nomination.value;
  if (!n) return;
  form.poste = (n.poste as (typeof POSTES_NOMINATION)[number] | null) ?? undefined;
  form.structurable_type = (n.structurable_type as (typeof STRUCTURABLE_TYPES)[number]) ?? "App\\Models\\Bureau";
  form.structurable_id = n.structurable_id ?? undefined;
  form.date_debut = n.date_debut ?? "";
  form.type_acte = (n.type_acte as (typeof TYPES_ACTE_NOMINATION)[number] | null) ?? "decision";
  editOpen.value = true;
}

async function save() {
  const payload: NominationUpdate = {
    poste: form.poste as (typeof POSTES_NOMINATION)[number] | undefined,
    structurable_type: form.structurable_type,
    structurable_id: form.structurable_id,
    date_debut: form.date_debut || undefined,
    type_acte: (form.type_acte as (typeof TYPES_ACTE_NOMINATION)[number]) || undefined,
  };
  busy.value = true;
  try {
    await nominationsApi.update(id.value, payload);
    toast.add({ title: "Nomination mise à jour", color: "success" });
    editOpen.value = false;
    await refresh();
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

async function telechargerActe() {
  busy.value = true;
  try {
    const blob = await nominationsApi.acte(id.value);
    downloadBlob(blob, `acte-nomination-${id.value}.pdf`);
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <BasePanel title="Nomination" subtitle="Nomination d'un agent à un poste de responsabilité">
    <template #actions>
      <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" to="/carriere/nominations">
        Retour
      </UButton>
    </template>

    <BaseDataState :pending="pending" :error="error" :empty="!nomination" empty-label="Nomination introuvable">
      <div v-if="nomination" class="space-y-6">
        <!-- En-tête -->
        <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-default bg-default p-5">
          <div class="min-w-0">
            <p class="text-lg font-semibold text-highlighted">{{ agentNom(nomination.agent) }}</p>
            <p class="text-sm text-muted">
              {{ nomination.poste ?? "—" }} ·
              {{ nomination.structure?.nom ?? structurableLabel(nomination.structurable_type) }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <CarriereStatutBadge :statut="nomination.statut" :label="nomination.statut_label" />
            <UButton v-if="peutModifier" icon="i-lucide-pencil" color="neutral" variant="soft" :loading="busy" @click="openEdit">
              Modifier
            </UButton>
            <UButton v-if="statut === 'approuvee'" icon="i-lucide-play" :loading="busy" @click="activer">
              Activer
            </UButton>
            <UButton
              v-else-if="statut === 'active'"
              icon="i-lucide-flag"
              color="neutral"
              variant="soft"
              :loading="busy"
              @click="cloturer"
            >
              Clôturer
            </UButton>
            <UButton
              v-if="essaiEnCours"
              icon="i-lucide-check"
              color="success"
              variant="soft"
              :loading="busy"
              @click="confirmerEssai"
            >
              Confirmer l'essai
            </UButton>
            <UButton
              v-if="essaiEnCours"
              icon="i-lucide-undo-2"
              color="error"
              variant="soft"
              :loading="busy"
              @click="rompreEssai"
            >
              Rompre l'essai
            </UButton>
            <UButton v-if="peutRejeter" icon="i-lucide-x" color="error" variant="soft" :loading="busy" @click="rejeter">
              Rejeter
            </UButton>
            <UButton
              v-if="peutActe"
              icon="i-lucide-file-down"
              color="neutral"
              variant="ghost"
              :loading="busy"
              @click="telechargerActe"
            >
              Acte PDF
            </UButton>
          </div>
        </div>

        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <!-- Détails -->
          <div class="rounded-xl border border-default bg-default p-5">
            <BaseCardTitle icon="i-lucide-award" title="Détails" />
            <dl class="mt-4 grid gap-x-10 gap-y-4 sm:grid-cols-2">
              <BaseDefItem label="Agent" :value="agentNom(nomination.agent)" />
              <BaseDefItem label="Poste" :value="nomination.poste" />
              <BaseDefItem
                label="Structure"
                :value="nomination.structure?.nom ?? structurableLabel(nomination.structurable_type)"
              />
              <BaseDefItem label="Type d'acte" :value="nomination.type_acte_label ?? nomination.type_acte" />
              <BaseDefItem label="Date de début" :value="formatDateLong(nomination.date_debut)" />
              <BaseDefItem label="Date de fin" :value="formatDateLong(nomination.date_fin)" />
              <BaseDefItem v-if="essai" label="Période d'essai (art. 50)" class="sm:col-span-2">
                <PositionsEssaiBadge :essai="essai" />
              </BaseDefItem>
            </dl>
          </div>

          <!-- Circuit -->
          <div class="rounded-xl border border-default bg-default p-5">
            <BaseCardTitle icon="i-lucide-git-merge" title="Circuit de validation" />
            <div class="mt-4">
              <CarriereCircuit :validations="nomination.validations ?? []" @changed="refresh" />
            </div>
          </div>
        </div>
      </div>
    </BaseDataState>

    <!-- Édition (en attente de validation) -->
    <UModal v-model:open="editOpen" title="Modifier la nomination">
      <template #title>
        <BaseCardTitle icon="i-lucide-pencil" title="Modifier la nomination" />
      </template>
      <template #body>
        <div class="space-y-4">
          <UFormField label="Poste" required>
            <USelect v-model="form.poste" :items="posteItems" placeholder="Choisir un poste" class="w-full" />
          </UFormField>
          <UFormField label="Structure" required>
            <CarriereStructurePicker v-model:type="form.structurable_type" v-model:id="form.structurable_id" />
          </UFormField>
          <div class="grid gap-3 sm:grid-cols-2">
            <UFormField label="Date de début" required>
              <UInput v-model="form.date_debut" type="date" class="w-full" />
            </UFormField>
            <UFormField label="Type d'acte">
              <USelect v-model="form.type_acte" :items="acteItems" class="w-full" />
            </UFormField>
          </div>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="editOpen = false">Annuler</UButton>
            <UButton :loading="busy" @click="save">Enregistrer</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </BasePanel>
</template>

