import { h, resolveComponent } from "vue";
import type { Column } from "@tanstack/vue-table";
import type { TableColumn } from "@nuxt/ui";

/**
 * Construit un en-tête de colonne triable (tri *client*, pur affichage — aucun
 * appel ni tri serveur, conforme aux conventions). À utiliser dans les fichiers
 * de colonnes : `{ accessorKey: "nom", header: sortableHeader("Nom") }`.
 */
export function sortableHeader<T>(label: string): TableColumn<T>["header"] {
  return ({ column }: { column: Column<T> }) => {
    const UButton = resolveComponent("UButton");
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
