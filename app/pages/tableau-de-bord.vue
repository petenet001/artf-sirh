<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Agent } from "~/schemas/agent";

const { stats, pending, error } = useDashboardStats();

const cards = computed(() => {
  const c = stats.value?.counts;
  return [
    { label: "Agents", value: c?.agents ?? 0, icon: "i-lucide-users", to: "/personnel/agents" },
    { label: "Stagiaires", value: c?.stagiaires ?? 0, icon: "i-lucide-graduation-cap", to: "/personnel/stagiaires" },
    { label: "Directions", value: c?.directions ?? 0, icon: "i-lucide-network", to: "/structure/directions" },
    { label: "Services", value: c?.services ?? 0, icon: "i-lucide-briefcase", to: "/structure/services" },
    { label: "Bureaux", value: c?.bureaux ?? 0, icon: "i-lucide-door-open", to: "/structure/bureaux" },
  ];
});

const maxStatut = computed(() =>
  Math.max(1, ...(stats.value?.parStatut.map((s) => s.count) ?? [1])),
);

const statutColor: Record<string, "primary" | "warning" | "neutral" | "error"> = {
  actif: "primary",
  suspendu: "warning",
  retraite: "neutral",
  inactif: "error",
};

const recentColumns: TableColumn<Agent>[] = [
  { accessorKey: "matricule", header: "Matricule" },
  { id: "nom", header: "Nom", cell: ({ row }) => row.original.nom_complet ?? `${row.original.prenom} ${row.original.nom}` },
  { accessorKey: "statut", header: "Statut" },
];
</script>

<template>
  <BasePanel
    title="Tableau de bord"
    subtitle="Visualisez l'ensemble de vos données essentielles et suivez l'activité RH en temps réel."
  >
    <div class="space-y-6">
      <BaseDataState :pending="pending" :error="error">
        <div class="space-y-6">
          <!-- Chiffres clés -->
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <BaseStatCard
            v-for="card in cards"
            :key="card.label"
            :label="card.label"
            :value="card.value"
            :icon="card.icon"
            :to="card.to"
          />
        </div>

        <div class="grid gap-6 lg:grid-cols-2">
          <!-- Répartition des agents par statut -->
          <UCard>
            <template #header>
              <BaseCardTitle icon="i-lucide-chart-no-axes-column" title="Agents par statut" />
            </template>
            <div class="space-y-3">
              <div v-for="row in stats?.parStatut ?? []" :key="row.statut">
                <div class="flex items-center justify-between text-sm mb-1">
                  <span class="capitalize text-toned">{{ row.statut }}</span>
                  <span class="font-medium text-highlighted">{{ row.count }}</span>
                </div>
                <div class="h-2 rounded-full bg-elevated overflow-hidden">
                  <div
                    class="h-full rounded-full bg-primary transition-all"
                    :style="{ width: `${(row.count / maxStatut) * 100}%` }"
                  />
                </div>
              </div>
            </div>
          </UCard>

          <!-- Agents récents -->
          <UCard :ui="{ body: 'p-0 sm:p-0' }">
            <template #header>
              <div class="flex items-center justify-between">
                <BaseCardTitle icon="i-lucide-users" title="Agents récents" />
                <UButton variant="link" trailing-icon="i-lucide-arrow-right" :padded="false" to="/personnel/agents">
                  Tout voir
                </UButton>
              </div>
            </template>
            <BaseTable :data="stats?.recents ?? []" :columns="recentColumns" :bordered="false">
              <template #statut-cell="{ row }">
                <UBadge :color="statutColor[row!.original.statut] ?? 'neutral'" variant="subtle" class="capitalize">
                  {{ row!.original.statut }}
                </UBadge>
              </template>
            </BaseTable>
          </UCard>
        </div>

        <!-- Accès rapides -->
        <div class="grid gap-4 sm:grid-cols-3">
          <UPageCard
            title="Nouvelle intégration"
            description="Choisir le type, remplir la fiche, soumettre le dossier"
            icon="i-lucide-user-plus"
            to="/integration/nouveau"
          />
          <UPageCard
            title="Structure"
            description="Localités, directions, services, bureaux"
            icon="i-lucide-building-2"
            to="/structure/administrations"
          />
          <UPageCard
            title="Référentiels"
            description="Grades, catégories, échelons, fonctions…"
            icon="i-lucide-list"
            to="/referentiels/grades"
          />
          </div>
        </div>
      </BaseDataState>
    </div>
  </BasePanel>
</template>
