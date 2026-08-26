<script setup lang="ts">
import type { Agent } from "~/schemas/agent";
import type { STRUCTURABLE_TYPES } from "~/constants/enums";
import type { AffectationGroupeeInput } from "~/schemas/affectation";

/**
 * Création d'un lot d'affectations (≥ 2 agents, un circuit, un acte).
 * Champs communs (date, motif, note de service optionnelle) + une ligne par
 * agent (agent, structure, supérieur optionnel). Redirige vers le lot créé.
 */
const affectationsApi = useAffectationsApi();
const toast = useToast();
const handleError = useApiError();

const { options: agentOptions } = useResourceOptions<Agent>(
  "opt-grp-agents",
  () => useAgentsApi().list(),
  (a) => a.nom_complet ?? `${a.prenom} ${a.nom}`,
);

const dateAffectation = ref("");
const motif = ref("");
const noteService = ref<File | null>(null);

interface Ligne {
  key: number;
  agentId?: number;
  structurable_type: (typeof STRUCTURABLE_TYPES)[number];
  structurable_id?: number;
  superieurId?: number;
}
const seq = ref(0);
const lignes = ref<Ligne[]>([]);
function addLigne() {
  lignes.value.push({ key: seq.value++, structurable_type: "App\\Models\\Bureau" });
}
function removeLigne(key: number) {
  lignes.value = lignes.value.filter((l) => l.key !== key);
}
// Deux lignes par défaut (minimum d'un lot).
addLigne();
addLigne();

function onFile(event: Event) {
  noteService.value = (event.target as HTMLInputElement).files?.[0] ?? null;
}

const submitting = ref(false);
async function submit() {
  const pretes = lignes.value.filter((l) => l.agentId && l.structurable_id);
  if (!dateAffectation.value || pretes.length < 2) {
    toast.add({ title: "Date requise et au moins deux agents (agent + structure).", color: "warning" });
    return;
  }
  const payload: AffectationGroupeeInput = {
    date_affectation: dateAffectation.value,
    motif: motif.value || undefined,
    agents: pretes.map((l) => ({
      agent_id: l.agentId as number,
      structurable_type: l.structurable_type,
      structurable_id: l.structurable_id as number,
      superieur_hierarchique_id: l.superieurId ?? undefined,
    })),
  };
  submitting.value = true;
  try {
    const { data } = await affectationsApi.creerGroupe(payload, noteService.value);
    toast.add({ title: "Lot d'affectations créé — un circuit initialisé", color: "success" });
    await navigateTo(`/carriere/affectations/lots/${data.id}`);
  } catch (err) {
    handleError(err);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <BasePanel title="Affectation groupée" subtitle="Affecter plusieurs agents en un seul circuit et un seul acte">
    <template #actions>
      <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" to="/carriere/affectations">
        Retour
      </UButton>
    </template>

    <div class="space-y-6">
      <!-- Champs communs -->
      <div class="rounded-xl border border-default bg-default p-5">
        <BaseCardTitle icon="i-lucide-settings-2" title="Paramètres communs" />
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <UFormField label="Date d'affectation" required>
            <UInput v-model="dateAffectation" type="date" class="w-full" />
          </UFormField>
          <UFormField label="Note de service (PDF/JPG/PNG)">
            <label
              class="inline-flex w-full cursor-pointer items-center gap-2 rounded-lg border border-default bg-default px-3 py-2 text-sm hover:border-primary/60"
            >
              <UIcon name="i-lucide-paperclip" class="size-4 text-muted" />
              <span class="truncate" :class="noteService ? 'text-highlighted' : 'text-muted'">
                {{ noteService?.name ?? "Choisir un fichier (optionnel)" }}
              </span>
              <input type="file" class="sr-only" accept=".pdf,.jpg,.jpeg,.png" @change="onFile">
            </label>
          </UFormField>
          <UFormField label="Motif" class="sm:col-span-2">
            <UTextarea v-model="motif" :rows="2" class="w-full" />
          </UFormField>
        </div>
      </div>

      <!-- Lignes d'agents -->
      <div class="rounded-xl border border-default bg-default p-5">
        <div class="flex items-center justify-between">
          <BaseCardTitle icon="i-lucide-users" title="Agents à affecter" />
          <UButton icon="i-lucide-plus" variant="soft" size="sm" @click="addLigne">Ajouter un agent</UButton>
        </div>

        <div class="mt-4 space-y-3">
          <div
            v-for="ligne in lignes"
            :key="ligne.key"
            class="grid items-start gap-3 rounded-lg border border-default p-3 lg:grid-cols-[1fr_1.4fr_1fr_auto]"
          >
            <USelectMenu v-model="ligne.agentId" value-key="value" :items="agentOptions" placeholder="Agent" class="w-full" />
            <CarriereStructurePicker v-model:type="ligne.structurable_type" v-model:id="ligne.structurable_id" />
            <USelectMenu v-model="ligne.superieurId" value-key="value" :items="agentOptions" placeholder="Supérieur (auto si vide)" class="w-full" />
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              size="xs"
              aria-label="Retirer"
              @click="removeLigne(ligne.key)"
            />
          </div>
        </div>
      </div>

      <div class="flex justify-end">
        <UButton icon="i-lucide-check" :loading="submitting" @click="submit">Créer le lot</UButton>
      </div>
    </div>
  </BasePanel>
</template>
