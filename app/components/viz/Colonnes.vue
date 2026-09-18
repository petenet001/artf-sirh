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
 *
 * Graduation : un quadrillage horizontal en hairline aux valeurs rondes de
 * `echelleRonde`, chiffré dans une gouttière à gauche. Il reste derrière les
 * colonnes et un cran au-dessus du fond — c'est un repère, pas une donnée.
 */
const props = withDefaults(
  defineProps<{ items: ItemRepartition[]; videLabel?: string }>(),
  { videLabel: "Aucune donnée" },
);

/** Les tranches vides restent : un creux dans la distribution est une information. */
const colonnes = computed(() => props.items.filter((i) => !/inconnu/i.test(i.cle) || i.total > 0));
const echelle = computed(() => echelleRonde(Math.max(0, ...colonnes.value.map((c) => c.total))));

const lignesGrille = computed(() =>
  echelle.value.graduations.map((valeur) => ({
    valeur,
    position: positionSurEchelle(valeur, echelle.value.borne),
  })),
);

/** Hauteur en pourcentage, avec un socle visible pour ne pas effacer les petits. */
function hauteur(total: number): number {
  if (total <= 0) return 0;
  return Math.max(3, positionSurEchelle(total, echelle.value.borne));
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

  <!-- `pt-5` : la place de la valeur écrite au-dessus de la plus haute colonne. -->
  <div v-else class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 pt-5">
    <div class="relative h-40 w-9" aria-hidden="true">
      <span
        v-for="ligne in lignesGrille"
        :key="ligne.valeur"
        class="absolute right-0 translate-y-1/2 text-[11px] leading-none text-muted tabular-nums"
        :style="{ bottom: `${ligne.position}%` }"
      >
        {{ formatGraduation(ligne.valeur) }}
      </span>
    </div>

    <div class="relative h-40">
      <span
        v-for="ligne in lignesGrille"
        :key="ligne.valeur"
        class="absolute inset-x-0 h-px"
        :style="{ bottom: `${ligne.position}%`, background: VIZ.grille }"
      />
      <div class="absolute inset-0 flex gap-2">
        <div
          v-for="colonne in colonnes"
          :key="colonne.cle"
          class="relative h-full min-w-0 flex-1"
          :title="`${colonne.libelle} : ${colonne.total}`"
        >
          <!-- Sommet arrondi, base carrée : la colonne pousse depuis la ligne de base. -->
          <span
            class="absolute bottom-0 left-1/2 w-full max-w-12 -translate-x-1/2 rounded-t-[4px]"
            :style="{ height: `${hauteur(colonne.total)}%`, background: VIZ.serie }"
          />
          <span
            class="absolute left-1/2 -translate-x-1/2 pb-1 text-sm font-semibold leading-none text-highlighted tabular-nums"
            :style="{ bottom: `${hauteur(colonne.total)}%` }"
          >
            {{ colonne.total }}
          </span>
        </div>
      </div>
    </div>

    <div class="col-start-2 mt-2 flex gap-2">
      <span
        v-for="colonne in colonnes"
        :key="colonne.cle"
        class="min-w-0 flex-1 truncate text-center text-[11px] text-muted"
      >
        {{ court(colonne.libelle) }}
      </span>
    </div>
  </div>
</template>
