<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Salaire } from "~/schemas/salaire";

/**
 * Grille salariale calculée (lecture) + régénération (permission `gerer-salaires`).
 * La grille et ses paramètres sont chargés par `useSalaireGrille`.
 */
const { data, pending, error, refresh } = useSalaireGrille();
const salairesApi = useSalairesApi();
const auth = useAuthStore();
const toast = useToast();
const handleError = useApiError();

const lignes = computed(() => data.value?.lignes ?? []);
const parametres = computed(() => data.value?.parametres ?? null);
const peutGerer = computed(() => auth.can("gerer-salaires"));

const fmt = (n: number | null | undefined) =>
  n == null ? "—" : new Intl.NumberFormat("fr-FR").format(n);

const columns: TableColumn<Salaire>[] = [
  { id: "categorie", header: "Catégorie", cell: ({ row }) => row.original.classe?.categorie?.nom ?? "—" },
  { id: "grade", header: "Grade", cell: ({ row }) => row.original.classe?.grade?.nom ?? "—" },
  { accessorKey: "echelon", header: "Échelon" },
  { accessorKey: "indice", header: "Indice" },
  { id: "salaire", header: "Salaire (FCFA)", cell: ({ row }) => fmt(row.original.salaire) },
];

// — Régénération de la grille ————————————————————————————
const open = ref(false);
const generating = ref(false);
const valeurPoint = ref<number | undefined>(undefined);

function openGenerate() {
  valeurPoint.value = parametres.value?.valeur_point_indice;
  open.value = true;
}

async function onGenerate() {
  generating.value = true;
  try {
    await salairesApi.generate({ valeur_point_indice: valeurPoint.value });
    toast.add({ title: "Grille salariale régénérée", color: "success" });
    open.value = false;
    await refresh();
  } catch (err) {
    handleError(err);
  } finally {
    generating.value = false;
  }
}
</script>

<template>
  <BasePanel
    title="Grille salariale"
    subtitle="Barème échelon × indice calculé à partir des classes et de la valeur du point d'indice."
  >
    <template #actions>
      <UButton v-if="peutGerer" icon="i-lucide-refresh-cw" @click="openGenerate">
        Régénérer la grille
      </UButton>
    </template>

    <div class="space-y-6">
      <!-- Paramètres de grille -->
      <div v-if="parametres" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BaseStatCard label="Valeur du point d'indice" :value="fmt(parametres.valeur_point_indice)" icon="i-lucide-coins" />
        <BaseStatCard label="Indice de base" :value="parametres.indice_base" icon="i-lucide-anchor" />
        <BaseStatCard label="Échelons" :value="`${parametres.echelon_depart} → ${parametres.echelon_fin}`" icon="i-lucide-trending-up" />
        <BaseStatCard label="Écart au départ" :value="parametres.ecart_depart" icon="i-lucide-move-horizontal" />
      </div>

      <BaseDataState :pending="pending" :error="error" :empty="!lignes.length" empty-label="Grille non générée">
        <BaseTable :data="lignes" :columns="columns" :page-size="10" searchable search-placeholder="Rechercher (grade, catégorie)…" />
      </BaseDataState>
    </div>

    <!-- Modale de régénération -->
    <UModal v-model:open="open" title="Régénérer la grille salariale">
      <template #body>
        <div class="space-y-4">
          <p class="text-sm text-muted">
            Recalcule l'intégralité de la grille. Laissez la valeur du point d'indice vide
            pour utiliser celle des paramètres.
          </p>
          <UFormField label="Valeur du point d'indice (optionnel)">
            <UInputNumber v-model="valeurPoint" :min="0" class="w-full" placeholder="Ex. 4500" />
          </UFormField>
          <div class="flex justify-end gap-2 pt-2">
            <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
            <UButton :loading="generating" icon="i-lucide-refresh-cw" @click="onGenerate">Régénérer</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </BasePanel>
</template>
