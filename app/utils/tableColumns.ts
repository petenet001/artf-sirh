import type { TableColumn } from "@nuxt/ui";
import type { Row } from "@tanstack/vue-table";

/**
 * Colonne de date prête à l'emploi : en-tête triable + valeur formatée
 * (`15/08/2026`). Évite de redéclarer un rendu de cellule dans chaque page et
 * garantit que **toutes** les listes affichent leurs dates de la même façon.
 *
 * `{ ...dateColumn("date_demande", "Demande") }` remplace
 * `{ accessorKey: "date_demande", header: sortableHeader("Demande") }`.
 */
export function dateColumn<T>(accessorKey: string, label: string): TableColumn<T> {
  return {
    accessorKey,
    header: sortableHeader<T>(label),
    cell: ({ row }: { row: Row<T> }) => formatDate(row.getValue(accessorKey) as string | null),
  };
}
