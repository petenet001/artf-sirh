<script setup lang="ts">
import type { ItemRepartition } from "~/schemas/reporting";
import { VIZ } from "~/constants/reporting";

/**
 * Histogramme : des colonnes verticales dans l'ordre des tranches.
 *
 * La forme juste pour une variable **continue découpée en tranches** — un âge,
 * une ancienneté : l'œil lit la silhouette de la distribution, ce qu'une liste
 * de barres horizontales ne donne pas. L'ordre n'est jamais trié par volume :
 * c'est la progression qui porte le sens.
 */
const props = withDefaults(
  defineProps<{ items: ItemRepartition[]; videLabel?: string }>(),
  { videLabel: "Aucune donnée" },
);

/** Les tranches vides restent : un creux dans la distribution est une information. */
const colonnes = computed(() => props.items.filter((i) => !/inconnu/i.test(i.cle) || i.total > 0));
const max = computed(() => Math.max(1, ...colonnes.value.map((c) => c.total)));

/** Hauteur en pourcentage, avec un socle visible pour ne pas effacer les petits. */
function hauteur(total: number): string {
  if (total <= 0) return "0%";
  return `${Math.max(3, (total / max.value) * 100)}%`;
}

/** Abrège les libellés de tranche pour tenir sous une colonne. */
function court(libelle: string): string {
  return libelle
    .replace(/^Moins de\s*/i, "< ")
    .replace(/\s*ans et plus$/i, "+")
    .replace(/\s*ans$/i, "")
    .replace(/^Âge\s+/i, "");
}
</script>

<template>
  <p v-if="!colonnes.length" class="py-6 text-center text-sm text-muted">{{ videLabel }}</p>

  <div v-else class="flex items-end gap-2" style="height: 180px">
    <div
      v-for="colonne in colonnes"
      :key="colonne.cle"
      class="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
      :title="`${colonne.libelle} : ${colonne.total}`"
    >
      <span class="text-sm font-semibold text-highlighted tabular-nums">{{ colonne.total }}</span>
      <!-- Sommet arrondi, base carrée : la colonne pousse depuis la ligne de base. -->
      <span
        class="w-full max-w-12 rounded-t-[4px]"
        :style="{ height: hauteur(colonne.total), background: VIZ.serie }"
      />
      <span class="w-full truncate text-center text-[11px] text-muted">{{ court(colonne.libelle) }}</span>
    </div>
  </div>
</template>
