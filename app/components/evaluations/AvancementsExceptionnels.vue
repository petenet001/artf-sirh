<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { AvancementExceptionnel, AvancementExceptionnelInput } from "~/schemas/avancement-exceptionnel";
import {
  agentNom,
  STATUT_BONIFICATION_COLOR,
  STATUT_BONIFICATION_LABEL,
  type StatutBonification,
} from "~/constants/evaluations";

/**
 * Avancements exceptionnels (CCN art. 72) : 1 ou 2 échelons accordés par la
 * commission d'avancement **sur proposition du DG**, hors cycle de notation.
 *
 * Côté API, proposition et décision demandent la même permission
 * (`valider-evaluations`) : c'est le rôle qui distingue le proposant (DG) du
 * décideur (RH), d'où les deux gardes ci-dessous.
 */
const api = useAvancementsExceptionnelsApi();
const agentsApi = useAgentsApi();
const acteur = useActeurEvaluation();
const toast = useToast();
const handleError = useApiError();

const peutProposer = computed(
  () => acteur.value.peutValider && (!!acteur.value.estDg || acteur.value.estRh),
);
const peutDecider = computed(() => acteur.value.estRh && acteur.value.peutValider);

const { data, pending, error, refresh } = useAsyncData("avancements-exceptionnels", () => api.list());
const propositions = computed(() => data.value?.data ?? []);

const { data: agentsData } = useAsyncData("exceptionnel-agents-select", () => agentsApi.list());
const agentOptions = computed(() =>
  (agentsData.value?.data ?? []).map((a) => ({ label: agentNom(a), value: a.id })),
);

const busy = ref(false);

const open = ref(false);
const form = reactive<Partial<AvancementExceptionnelInput>>({});

function ouvrir() {
  form.agent_id = undefined;
  form.nb_echelons = 1;
  form.motif = "";
  open.value = true;
}

async function soumettre() {
  if (!form.agent_id || !form.motif || form.motif.trim().length < 10) {
    toast.add({ title: "Agent et motif (10 caractères min.) sont requis.", color: "error" });
    return;
  }
  busy.value = true;
  try {
    await api.create({
      agent_id: form.agent_id,
      nb_echelons: form.nb_echelons ?? 1,
      motif: form.motif.trim(),
    });
    toast.add({ title: "Proposition enregistrée", color: "success" });
    open.value = false;
    await refresh();
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

async function traiter(proposition: AvancementExceptionnel, approuver: boolean) {
  const commentaire = approuver ? undefined : prompt("Motif du rejet (facultatif) :") ?? undefined;
  busy.value = true;
  try {
    await api.traiter(proposition.id, { approuver, commentaire: commentaire || null });
    toast.add({ title: approuver ? "Proposition approuvée" : "Proposition rejetée", color: "success" });
    await refresh();
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

async function appliquer(proposition: AvancementExceptionnel) {
  busy.value = true;
  try {
    const { data: resultat } = await api.appliquer(proposition.id);
    toast.add({ title: resultat.message ?? "Échelons appliqués", color: resultat.avance ? "success" : "neutral" });
    await refresh();
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

const columns: TableColumn<AvancementExceptionnel>[] = [
  {
    id: "agent",
    header: "Agent",
    accessorFn: (a) => agentNom(a.agent),
    cell: ({ row }) => agentNom(row.original.agent),
  },
  { id: "echelons", header: "Échelons" },
  { id: "motif", header: "Motif" },
  { id: "statut", header: "Statut" },
  { id: "actions", header: "" },
];
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <BaseCardTitle icon="i-lucide-rocket" title="Avancements exceptionnels (art. 72)" />
      <UButton v-if="peutProposer" size="xs" icon="i-lucide-plus" @click="ouvrir">Proposer</UButton>
    </div>
    <p class="mt-2 text-xs text-muted">
      1 ou 2 échelons, sur proposition du Directeur Général, accordés par la commission d'avancement.
    </p>

    <div class="mt-4">
      <BaseDataState :pending="pending" :error="error">
        <BaseTable :data="propositions" :columns="columns" :bordered="false" :page-size="10" searchable>
          <template #empty>
            <p class="py-6 text-center text-sm text-muted">Aucune proposition</p>
          </template>
          <template #echelons-cell="{ row }">
            <span class="text-sm">+{{ row!.original.nb_echelons ?? "—" }}</span>
          </template>
          <template #motif-cell="{ row }">
            <span class="line-clamp-2 text-sm text-default">{{ row!.original.motif }}</span>
          </template>
          <template #statut-cell="{ row }">
            <div class="flex items-center gap-2">
              <UBadge
                :color="STATUT_BONIFICATION_COLOR[row!.original.statut as StatutBonification] ?? 'neutral'"
                variant="subtle"
              >
                {{ row!.original.statut_label ?? STATUT_BONIFICATION_LABEL[row!.original.statut as StatutBonification] }}
              </UBadge>
              <UBadge v-if="row!.original.applique_le" color="success" variant="outline" size="sm">Appliqué</UBadge>
            </div>
          </template>
          <template #actions-cell="{ row }">
            <div v-if="peutDecider" class="flex justify-end gap-2">
              <template v-if="row!.original.statut === 'en_attente'">
                <UButton size="xs" color="success" variant="soft" icon="i-lucide-check" :loading="busy" @click="traiter(row!.original, true)">
                  Approuver
                </UButton>
                <UButton size="xs" color="error" variant="soft" icon="i-lucide-x" :loading="busy" @click="traiter(row!.original, false)">
                  Rejeter
                </UButton>
              </template>
              <UButton
                v-else-if="row!.original.statut === 'approuvee' && !row!.original.applique_le"
                size="xs"
                icon="i-lucide-trending-up"
                :loading="busy"
                @click="appliquer(row!.original)"
              >
                Appliquer
              </UButton>
            </div>
          </template>
        </BaseTable>
      </BaseDataState>
    </div>

    <UModal v-model:open="open" title="Proposer un avancement exceptionnel">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Agent" name="agent_id" required>
            <USelectMenu v-model="form.agent_id" :items="agentOptions" value-key="value" placeholder="Sélectionner un agent" class="w-full" />
          </UFormField>
          <UFormField label="Échelons proposés" name="nb_echelons" required help="1 ou 2 — 422 au-delà.">
            <UInputNumber v-model="form.nb_echelons" :min="1" :max="2" class="w-full" />
          </UFormField>
          <UFormField label="Motif" name="motif" required>
            <UTextarea v-model="form.motif" :rows="4" placeholder="Justification (10 caractères min.)" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
            <UButton :loading="busy" @click="soumettre">Proposer</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
