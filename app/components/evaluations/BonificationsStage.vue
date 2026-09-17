<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { BonificationStage, BonificationStageInput } from "~/schemas/bonification-stage";
import { TYPES_DOCUMENT_BONIFICATION } from "~/constants/enums";
import {
  agentNom,
  STATUT_BONIFICATION_COLOR,
  STATUT_BONIFICATION_LABEL,
  type StatutBonification,
} from "~/constants/evaluations";

/**
 * Bonifications de stage (CCN art. 71) : +2 échelons pour un stage autorisé
 * d'au moins 9 mois, justifié par un certificat ou une attestation. Parcours
 * séparé du cycle de notation de 24 mois.
 *
 * L'API calcule elle-même la durée et refuse (422) en deçà de 9 mois : on ne
 * rejoue pas la règle ici, on affiche son message.
 */
const api = useBonificationsStageApi();
const agentsApi = useAgentsApi();
const acteur = useActeurEvaluation();
const toast = useToast();
const handleError = useApiError();

const peutDecider = computed(() => acteur.value.estRh && acteur.value.peutValider);

const { data, pending, error, refresh } = useAsyncData("bonifications-stage", () => api.list());
const demandes = computed(() => data.value?.data ?? []);

const { data: agentsData } = useAsyncData("bonification-agents-select", () => agentsApi.list());
const agentOptions = computed(() =>
  (agentsData.value?.data ?? []).map((a) => ({ label: agentNom(a), value: a.id })),
);

const busy = ref(false);

// — Dépôt d'une demande ————————————————————————————————————————
const open = ref(false);
/** État du formulaire (sans `null` : les contrôles n'acceptent que `string | undefined`). */
interface BonificationForm {
  agent_id?: number;
  date_debut_stage?: string;
  date_fin_stage?: string;
  type_document?: BonificationStageInput["type_document"];
  reference_document?: string;
}
const form = reactive<BonificationForm>({});

function ouvrir() {
  form.agent_id = undefined;
  form.date_debut_stage = undefined;
  form.date_fin_stage = undefined;
  form.type_document = "certificat";
  form.reference_document = undefined;
  open.value = true;
}

async function soumettre() {
  if (!form.agent_id || !form.date_debut_stage || !form.date_fin_stage || !form.type_document) {
    toast.add({ title: "Agent, période et type de document sont requis.", color: "error" });
    return;
  }
  busy.value = true;
  try {
    await api.create({
      agent_id: form.agent_id,
      date_debut_stage: form.date_debut_stage,
      date_fin_stage: form.date_fin_stage,
      type_document: form.type_document,
      reference_document: form.reference_document?.trim() || null,
    });
    toast.add({ title: "Demande de bonification déposée", color: "success" });
    open.value = false;
    await refresh();
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

// — Décision et application ———————————————————————————————————
async function traiter(demande: BonificationStage, approuver: boolean) {
  const commentaire = approuver ? undefined : prompt("Motif du rejet (facultatif) :") ?? undefined;
  busy.value = true;
  try {
    await api.traiter(demande.id, { approuver, commentaire: commentaire || null });
    toast.add({ title: approuver ? "Bonification approuvée" : "Bonification rejetée", color: "success" });
    await refresh();
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

async function appliquer(demande: BonificationStage) {
  busy.value = true;
  try {
    const { data: resultat } = await api.appliquer(demande.id);
    toast.add({ title: resultat.message ?? "Échelons appliqués", color: resultat.avance ? "success" : "neutral" });
    await refresh();
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

const columns: TableColumn<BonificationStage>[] = [
  {
    id: "agent",
    header: "Agent",
    accessorFn: (b) => agentNom(b.agent),
    cell: ({ row }) => agentNom(row.original.agent),
  },
  {
    id: "periode",
    header: "Stage",
    cell: ({ row }) => formatPeriode(row.original.date_debut_stage, row.original.date_fin_stage),
  },
  { id: "duree", header: "Durée" },
  { id: "statut", header: "Statut" },
  { id: "actions", header: "" },
];
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <BaseCardTitle icon="i-lucide-graduation-cap" title="Bonifications de stage (art. 71)" />
      <UButton size="xs" icon="i-lucide-plus" @click="ouvrir">Nouvelle demande</UButton>
    </div>
    <p class="mt-2 text-xs text-muted">
      Stage autorisé d'au moins 9 mois, justifié par un certificat ou une attestation : +2 échelons.
    </p>

    <div class="mt-4">
      <BaseDataState :pending="pending" :error="error">
        <BaseTable :data="demandes" :columns="columns" :bordered="false" :page-size="10" searchable>
          <template #empty>
            <p class="py-6 text-center text-sm text-muted">Aucune demande de bonification</p>
          </template>
          <template #duree-cell="{ row }">
            <span class="text-sm">{{ row!.original.duree_mois != null ? `${row!.original.duree_mois} mois` : "—" }}</span>
          </template>
          <template #statut-cell="{ row }">
            <div class="flex items-center gap-2">
              <UBadge
                :color="STATUT_BONIFICATION_COLOR[row!.original.statut as StatutBonification] ?? 'neutral'"
                variant="subtle"
              >
                {{ row!.original.statut_label ?? STATUT_BONIFICATION_LABEL[row!.original.statut as StatutBonification] }}
              </UBadge>
              <UBadge v-if="row!.original.applique_le" color="success" variant="outline" size="sm">Appliquée</UBadge>
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

    <UModal v-model:open="open" title="Demande de bonification de stage">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Agent" name="agent_id" required>
            <USelectMenu v-model="form.agent_id" :items="agentOptions" value-key="value" placeholder="Sélectionner un agent" class="w-full" />
          </UFormField>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Début du stage" name="date_debut_stage" required>
              <UInput v-model="form.date_debut_stage" type="date" class="w-full" />
            </UFormField>
            <UFormField label="Fin du stage" name="date_fin_stage" required>
              <UInput v-model="form.date_fin_stage" type="date" class="w-full" />
            </UFormField>
          </div>
          <UFormField label="Pièce justificative" name="type_document" required>
            <USelect
              v-model="form.type_document"
              :items="TYPES_DOCUMENT_BONIFICATION.map((t) => ({ label: t === 'certificat' ? 'Certificat' : 'Attestation', value: t }))"
              value-key="value"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Référence du document" name="reference_document">
            <UInput v-model="form.reference_document" placeholder="Ex. CERT-2026-001" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
            <UButton :loading="busy" @click="soumettre">Déposer la demande</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
