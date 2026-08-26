<script setup lang="ts">
import type { Agent } from "~/schemas/agent";
import type { STRUCTURABLE_TYPES } from "~/constants/enums";
import type { NominationGroupeeInput } from "~/schemas/nomination";
import { POSTES_NOMINATION, TYPES_ACTE_NOMINATION } from "~/schemas/nomination";

/**
 * Création d'un lot de nominations (≥ 2 agents, un circuit, un acte).
 * Champs communs (date de début, type d'acte) + une ligne par agent
 * (agent, poste, structure). Une structure = une seule ligne dans le lot.
 */
const nominationsApi = useNominationsApi();
const toast = useToast();
const handleError = useApiError();

const { options: agentOptions } = useResourceOptions<Agent>(
  "opt-grp-nom-agents",
  () => useAgentsApi().list(),
  (a) => a.nom_complet ?? `${a.prenom} ${a.nom}`,
);
const posteItems = POSTES_NOMINATION.map((p) => ({ label: p, value: p }));
const acteItems = TYPES_ACTE_NOMINATION.map((t) => ({ label: t, value: t }));

const dateDebut = ref("");
const typeActe = ref<(typeof TYPES_ACTE_NOMINATION)[number]>("decision");

interface Ligne {
  key: number;
  agentId?: number;
  poste?: (typeof POSTES_NOMINATION)[number];
  structurable_type: (typeof STRUCTURABLE_TYPES)[number];
  structurable_id?: number;
}
const seq = ref(0);
const lignes = ref<Ligne[]>([]);
function addLigne() {
  lignes.value.push({ key: seq.value++, structurable_type: "App\\Models\\Bureau" });
}
function removeLigne(key: number) {
  lignes.value = lignes.value.filter((l) => l.key !== key);
}
addLigne();
addLigne();

const submitting = ref(false);
async function submit() {
  const pretes = lignes.value.filter((l) => l.agentId && l.poste && l.structurable_id);
  if (!dateDebut.value || pretes.length < 2) {
    toast.add({ title: "Date requise et au moins deux lignes complètes (agent + poste + structure).", color: "warning" });
    return;
  }
  const payload: NominationGroupeeInput = {
    date_debut: dateDebut.value,
    type_acte: (typeActe.value as (typeof TYPES_ACTE_NOMINATION)[number]) || undefined,
    agents: pretes.map((l) => ({
      agent_id: l.agentId as number,
      poste: l.poste as (typeof POSTES_NOMINATION)[number],
      structurable_type: l.structurable_type,
      structurable_id: l.structurable_id as number,
    })),
  };
  submitting.value = true;
  try {
    const { data } = await nominationsApi.creerGroupe(payload);
    toast.add({ title: "Lot de nominations créé — un circuit initialisé", color: "success" });
    await navigateTo(`/carriere/nominations/lots/${data.id}`);
  } catch (err) {
    handleError(err);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <BasePanel title="Nomination groupée" subtitle="Nommer plusieurs agents en un seul circuit et un seul acte">
    <template #actions>
      <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" to="/carriere/nominations">
        Retour
      </UButton>
    </template>

    <div class="space-y-6">
      <div class="rounded-xl border border-default bg-default p-5">
        <BaseCardTitle icon="i-lucide-settings-2" title="Paramètres communs" />
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <UFormField label="Date de début" required>
            <UInput v-model="dateDebut" type="date" class="w-full" />
          </UFormField>
          <UFormField label="Type d'acte">
            <USelect v-model="typeActe" :items="acteItems" class="w-full" />
          </UFormField>
        </div>
      </div>

      <div class="rounded-xl border border-default bg-default p-5">
        <div class="flex items-center justify-between">
          <BaseCardTitle icon="i-lucide-users" title="Agents à nommer" />
          <UButton icon="i-lucide-plus" variant="soft" size="sm" @click="addLigne">Ajouter un agent</UButton>
        </div>

        <div class="mt-4 space-y-3">
          <div
            v-for="ligne in lignes"
            :key="ligne.key"
            class="grid items-start gap-3 rounded-lg border border-default p-3 lg:grid-cols-[1fr_1fr_1.4fr_auto]"
          >
            <USelect v-model="ligne.agentId" :items="agentOptions" placeholder="Agent" class="w-full" />
            <USelect v-model="ligne.poste" :items="posteItems" placeholder="Poste" class="w-full" />
            <CarriereStructurePicker v-model:type="ligne.structurable_type" v-model:id="ligne.structurable_id" />
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
