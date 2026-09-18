<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { AuditLog } from "~/schemas/audit-log";

/**
 * Journal d'audit (note FE §2k.3, ligne « Audit / paramètres app »).
 *
 * Seule entrée du menu gardée par un **rôle** et non par une permission :
 * `GET /audit-logs` porte `role:admin`. La note assume l'exception, on la
 * reproduit telle quelle — y compris son corollaire : la RH n'y a pas accès.
 *
 * Écran en lecture seule, par nature : un journal qu'on peut modifier ne prouve
 * plus rien.
 */
const api = useAuditLogsApi();

const { data, pending, error } = useAsyncData("audit-logs", () => api.list());
const entrees = computed(() => data.value?.data ?? []);

const ALL = "__all__";
const filtreAction = ref<string>(ALL);
const actions = computed(() => [...new Set(entrees.value.map((e) => e.action))].sort());
const actionItems = computed(() => [
  { label: "Toutes les actions", value: ALL },
  ...actions.value.map((a) => ({ label: a, value: a })),
]);

const rows = computed(() =>
  filtreAction.value === ALL
    ? entrees.value
    : entrees.value.filter((e) => e.action === filtreAction.value),
);

/** Objet visé, sous une forme lisible : `App\Models\Agent` → « Agent nº 12 ». */
function cible(entree: AuditLog): string {
  if (!entree.loggable_type) return "—";
  const nom = entree.loggable_type.split("\\").pop() ?? entree.loggable_type;
  return entree.loggable_id ? `${nom} nº ${entree.loggable_id}` : nom;
}

/**
 * Détail JSON, replié par défaut. Une entrée d'audit porte un payload
 * arbitraire : l'étaler dans la table rendrait la liste illisible, alors que
 * l'essentiel est « qui, quoi, quand ».
 */
const ouverte = ref<number | null>(null);
function basculer(id: number) {
  ouverte.value = ouverte.value === id ? null : id;
}
function detailLisible(details: unknown): string {
  if (details == null) return "";
  return JSON.stringify(details, null, 2);
}

const columns: TableColumn<AuditLog>[] = [
  { id: "quand", header: "Quand" },
  { id: "qui", header: "Qui" },
  { accessorKey: "action", header: "Action" },
  { id: "cible", header: "Objet" },
  { id: "details", header: "" },
];
</script>

<template>
  <BasePanel title="Journal d'audit" subtitle="Qui a fait quoi, et quand — lecture seule">
    <BaseDataState :pending="pending" :error="error">
      <BaseTable
        :data="rows"
        :columns="columns"
        searchable
        search-placeholder="Rechercher une action, un utilisateur…"
        :page-size="25"
        empty-label="Aucune entrée dans le journal."
      >
        <template #filters>
          <USelect v-model="filtreAction" :items="actionItems" class="w-64" />
        </template>

        <template #quand-cell="{ row }">
          <span class="whitespace-nowrap text-sm tabular-nums text-muted">
            {{ formatDateTime(row!.original.created_at) }}
          </span>
        </template>

        <template #qui-cell="{ row }">
          <div class="min-w-0">
            <p class="truncate text-sm text-highlighted">
              {{ row!.original.user?.name ?? (row!.original.user_id ? `Utilisateur nº ${row!.original.user_id}` : "Système") }}
            </p>
            <p v-if="row!.original.ip_address" class="text-xs text-dimmed">
              {{ row!.original.ip_address }}
            </p>
          </div>
        </template>

        <template #cible-cell="{ row }">
          <span class="text-sm text-muted">{{ cible(row!.original) }}</span>
        </template>

        <template #details-cell="{ row }">
          <div class="flex justify-end">
            <UButton
              v-if="row!.original.details != null"
              size="xs"
              color="neutral"
              variant="ghost"
              :icon="ouverte === row!.original.id ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
              :title="ouverte === row!.original.id ? 'Masquer le détail' : 'Voir le détail'"
              @click="basculer(row!.original.id)"
            />
          </div>
        </template>
      </BaseTable>

      <!--
        Le détail sort de la table plutôt que d'y ajouter une ligne dépliante :
        un JSON arbitraire n'a pas de colonnes, et le forcer dans la grille
        casserait l'alignement de toutes les autres lignes.
      -->
      <div
        v-if="ouverte !== null"
        class="mt-4 rounded-xl border border-default bg-elevated/50 p-5"
      >
        <BaseCardTitle icon="i-lucide-code" title="Détail de l'entrée" />
        <pre class="mt-3 overflow-x-auto text-xs text-toned">{{
          detailLisible(entrees.find((e) => e.id === ouverte)?.details)
        }}</pre>
      </div>
    </BaseDataState>
  </BasePanel>
</template>
