import { h } from "vue";
import { UButton } from "#components";
import type { Column } from "@tanstack/vue-table";
import type { TableColumn } from "@nuxt/ui";

/**
 * Construit un en-tête de colonne triable (tri *client*, pur affichage — aucun
 * appel ni tri serveur, conforme aux conventions). À utiliser dans les fichiers
 * de colonnes : `{ accessorKey: "nom", header: sortableHeader("Nom") }`.
 *
 * ⚠️ `UButton` est **importé**, pas résolu par `resolveComponent`.
 *
 * TanStack rend les en-têtes depuis son propre contexte : l'instance de rendu
 * de Vue est alors nulle, `resolveComponent` échoue silencieusement et renvoie
 * la chaîne « UButton ». Le navigateur reçoit une balise inconnue, qu'il
 * n'affiche pas — d'où des en-têtes vides sur les seules colonnes triables,
 * sans la moindre erreur en console.
 */
export function sortableHeader<T>(label: string): TableColumn<T>["header"] {
  return ({ column }: { column: Column<T> }) => {
    const sorted = column.getIsSorted();
    return h(UButton, {
      label,
      color: "neutral",
      variant: "ghost",
      size: "xs",
      class: "-mx-2.5 font-semibold",
      trailingIcon: sorted
        ? sorted === "asc"
          ? "i-lucide-arrow-up-narrow-wide"
          : "i-lucide-arrow-down-wide-narrow"
        : "i-lucide-arrow-up-down",
      onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
    });
  };
}
