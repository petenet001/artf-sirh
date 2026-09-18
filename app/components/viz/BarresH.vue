<script setup lang="ts">
import type { ItemRepartition } from "~/schemas/reporting";
import { VIZ } from "~/constants/reporting";

/**
 * Barres horizontales pour **une seule mesure** (un effectif, un nombre de
 * jours) : une grandeur se lit avec une couleur unique, la teinte n'a rien à
 * distinguer — d'où pas de légende, et la valeur écrite au bout de chaque barre.
 *
 * Les libellés vivent hors de la barre : jamais de texte tronqué par sa propre
 * barre. Les catégories vides sont masquées par défaut — un zéro n'apprend rien
 * et dilue les valeurs réelles.
 *
 * Graduation : l'échelle s'arrête sur une valeur ronde (`echelleRonde`), des
 * encoches du fond marquent chaque pas dans la piste, et une réglette chiffrée
 * ferme la liste. Les barres sont proportionnées à cette borne ronde, pas au
 * maximum brut — sans quoi les encoches ne tomberaient pas sur leur valeur.
 */
const props = withDefaults(
  defineProps<{
    items: ItemRepartition[];
    /** Suffixe de la valeur (« j », « agents »…). */
    suffixe?: string;
    /** Nombre maximum de barres ; le reste est regroupé en « Autres ». */
    limite?: number;
    /**
     * Conserver l'ordre fourni au lieu de trier par volume. Indispensable sur un
     * axe **ordonné** — une tranche d'âge, un palier d'ancienneté : le tri par
     * volume y détruirait l'information portée par la suite des catégories.
     */
    ordonne?: boolean;
    /** Afficher les catégories à zéro. */
    garderZeros?: boolean;
    videLabel?: string;
  }>(),
  { suffixe: "", limite: 8, garderZeros: false, ordonne: false, videLabel: "Aucune donnée" },
);

const lignes = computed(() => {
  const retenus = props.garderZeros ? [...props.items] : props.items.filter((i) => i.total > 0);
  const tries = props.ordonne ? retenus : retenus.sort((a, b) => b.total - a.total);

  // Sur un axe ordonné, on ne regroupe pas : la suite doit rester entière.
  if (props.ordonne || tries.length <= props.limite) return tries;

  // Au-delà de la limite, le reste devient une ligne « Autres » plutôt qu'une
  // liste illisible : la somme reste juste, le détail vit dans l'écran métier.
  const tete = tries.slice(0, props.limite - 1);
  const reste = tries.slice(props.limite - 1);
  return [
    ...tete,
    {
      cle: "__autres__",
      libelle: `Autres (${reste.length})`,
      total: reste.reduce((somme, i) => somme + i.total, 0),
    },
  ];
});

const echelle = computed(() => echelleRonde(Math.max(0, ...lignes.value.map((l) => l.total))));
const totalGeneral = computed(() => lignes.value.reduce((somme, l) => somme + l.total, 0));

/** Encoches intérieures : ni le zéro ni la borne, qui sont les bords de la piste. */
const encoches = computed(() =>
  echelle.value.graduations
    .slice(1, -1)
    .map((valeur) => positionSurEchelle(valeur, echelle.value.borne)),
);

const reglette = computed(() =>
  echelle.value.graduations.map((valeur) => ({
    position: positionSurEchelle(valeur, echelle.value.borne),
    libelle: formatGraduation(valeur),
  })),
);

/** Largeur de barre, avec un minimum visible pour ne pas effacer les petits. */
function largeur(total: number): string {
  if (total <= 0) return "0%";
  return `${Math.max(1.5, positionSurEchelle(total, echelle.value.borne))}%`;
}

/** Part du total, pour l'infobulle — le pourcentage encombrerait la ligne. */
function part(total: number): string {
  if (!totalGeneral.value) return "";
  return ` · ${Math.round((total / totalGeneral.value) * 100)} % de l'ensemble`;
}
</script>

<template>
  <p v-if="!lignes.length" class="py-6 text-center text-sm text-muted">{{ videLabel }}</p>

  <div v-else>
    <ul class="flex flex-col gap-3">
      <li
        v-for="ligne in lignes"
        :key="ligne.cle"
        class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1"
        :title="`${ligne.libelle} : ${ligne.total}${suffixe ? ' ' + suffixe : ''}${part(ligne.total)}`"
      >
        <span class="truncate text-sm text-toned">{{ ligne.libelle }}</span>
        <span class="text-sm font-semibold text-highlighted tabular-nums">
          {{ ligne.total.toLocaleString("fr-FR") }}<span v-if="suffixe" class="ml-0.5 font-normal text-muted">{{ suffixe }}</span>
        </span>
        <span class="relative col-span-2 block h-2.5 w-full rounded-[2px]" :style="{ background: VIZ.piste }">
          <!-- Encoches : 1px de fond dans la piste. La barre passe par-dessus,
               la graduation reste lisible sur toute la partie non remplie. -->
          <span
            v-for="position in encoches"
            :key="position"
            class="absolute inset-y-0 w-px"
            :style="{ left: `${position}%`, background: VIZ.encoche }"
          />
          <span
            class="relative block h-full rounded-r-[4px]"
            :style="{ width: largeur(ligne.total), background: VIZ.serie }"
          />
        </span>
      </li>
    </ul>
    <VizGraduations class="mt-1.5" :graduations="reglette" />
  </div>
</template>
