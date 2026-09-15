<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Absence } from "~/schemas/absence";
import { STATUTS_ABSENCE } from "~/constants/enums";
import { agentNom, STATUT_ABSENCE_LABEL } from "~/constants/conges";

/**
 * Absences des agents. Portées « Mes absences », « À valider » (file N+1
 * calculée par l'API) et « Toutes » ; déclaration (create). Valider / rejeter
 * ne se proposent **que dans la file** : seul le N+1 réel de l'agent (ou
 * `admin`) peut signer — un RH avec `valider-absences` reçoit 403 ailleurs.
 */
const auth = useAuthStore();
const absencesApi = useAbsencesApi();
const toast = useToast();
const handleError = useApiError();
const { absences, scope, pending, error, refresh } = useAbsences();

const peutValider = computed(() => auth.can("valider-absences") || auth.hasRole("admin"));
const peutCreer = computed(() => auth.can("creer-absences"));
const actionsVisibles = computed(() => scope.value === "a_valider");

const scopeItems = computed(() => [
  ...(auth.user?.agent_id ? [{ label: "Mes absences", value: "mine" as const }] : []),
  ...(peutValider.value
    ? [
        { label: "À valider", value: "a_valider" as const },
        { label: "Toutes les absences", value: "all" as const },
      ]
    : []),
]);

const ALL = "__all__";
const statutItems = [
  { label: "Tous les statuts", value: ALL },
  ...STATUTS_ABSENCE.map((s) => ({ label: STATUT_ABSENCE_LABEL[s], value: s })),
];
const statut = ref<string>(ALL);
const rows = computed(() =>
  statut.value === ALL ? absences.value : absences.value.filter((a) => a.statut === statut.value),
);

const modalOpen = ref(false);

const columns = computed<TableColumn<Absence>[]>(() => {
  const base: TableColumn<Absence>[] = [
    { id: "agent", header: "Agent", cell: ({ row }) => agentNom(row.original.agent) },
    { id: "type", header: "Type", cell: ({ row }) => row.original.type_absence?.nom ?? "—" },
    { id: "periode", header: "Période", cell: ({ row }) => formatPeriode(row.original.date_debut, row.original.date_fin) },
    { accessorKey: "nb_jours", header: "Jours" },
    { id: "justifiee", header: "Justifiée" },
    { id: "statut", header: "Statut" },
  ];
  return actionsVisibles.value ? [...base, { id: "actions", header: "" }] : base;
});

// — Actions ————————————————————————————————————————————————————
const busyId = ref<number | null>(null);

async function valider(a: Absence) {
  busyId.value = a.id;
  try {
    await absencesApi.valider(a.id);
    toast.add({ title: "Absence validée", color: "success" });
    await refresh();
  } catch (err) {
    handleError(err);
  } finally {
    busyId.value = null;
  }
}

const rejetOpen = ref(false);
const rejetComment = ref("");
const rejetCible = ref<Absence | null>(null);

function ouvrirRejet(a: Absence) {
  rejetCible.value = a;
  rejetComment.value = "";
  rejetOpen.value = true;
}

async function confirmerRejet() {
  if (!rejetCible.value || !rejetComment.value.trim()) {
    toast.add({ title: "Motif requis.", color: "error" });
    return;
  }
  busyId.value = rejetCible.value.id;
  try {
    await absencesApi.rejeter(rejetCible.value.id, { commentaire: rejetComment.value.trim() });
    toast.add({ title: "Absence rejetée", color: "success" });
    rejetOpen.value = false;
    await refresh();
  } catch (err) {
    handleError(err);
  } finally {
    busyId.value = null;
  }
}
</script>

<template>
  <BasePanel title="Absences" subtitle="Déclarations et validation des absences">
    <!-- Pas d'état « vide » global : la table garde portée et bouton de déclaration. -->
    <BaseDataState :pending="pending" :error="error">
      <BaseTable :data="rows" :columns="columns" searchable search-placeholder="Rechercher un agent…" :page-size="10">
        <template #filters>
          <USelect v-if="scopeItems.length > 1" v-model="scope" :items="scopeItems" value-key="value" class="w-44" />
          <USelect v-model="statut" :items="statutItems" class="w-44" />
        </template>
        <template #actions>
          <UButton v-if="peutCreer" icon="i-lucide-plus" @click="modalOpen = true">Déclarer une absence</UButton>
        </template>
        <template #empty>
          <p class="py-6 text-center text-sm text-muted">
            {{ scope === "a_valider" ? "Aucune absence à valider" : "Aucune absence" }}
          </p>
        </template>
        <template #justifiee-cell="{ row }">
          <UIcon
            :name="row!.original.justifiee ? 'i-lucide-check' : 'i-lucide-minus'"
            :class="row!.original.justifiee ? 'text-success' : 'text-dimmed'"
          />
        </template>
        <template #statut-cell="{ row }">
          <CongesAbsenceStatutBadge :statut="row!.original.statut" :label="row!.original.statut_label" />
        </template>
        <template #actions-cell="{ row }">
          <div v-if="row!.original.statut === 'en_attente'" class="flex justify-end gap-1">
            <UButton
              icon="i-lucide-check"
              color="success"
              variant="ghost"
              size="xs"
              :loading="busyId === row!.original.id"
              aria-label="Valider l'absence"
              @click="valider(row!.original)"
            />
            <UButton
              icon="i-lucide-x"
              color="error"
              variant="ghost"
              size="xs"
              aria-label="Rejeter l'absence"
              @click="ouvrirRejet(row!.original)"
            />
          </div>
        </template>
      </BaseTable>
    </BaseDataState>

    <CongesAbsenceModal v-model:open="modalOpen" @created="refresh" />

    <UModal v-model:open="rejetOpen" title="Rejeter l'absence">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Motif du rejet" name="commentaire" required>
            <UTextarea v-model="rejetComment" placeholder="Expliquez le rejet" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="rejetOpen = false">Annuler</UButton>
            <UButton color="error" :loading="busyId != null" @click="confirmerRejet">Rejeter</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </BasePanel>
</template>
