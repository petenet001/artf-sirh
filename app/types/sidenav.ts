/**
 * Entrée de `BaseSideNav` (colonne de navigation des fiches, cf. maquette).
 * Soit pilotée par `v-model` (via `key`), soit lien de route (via `to`).
 */
export interface SideNavItem {
  key: string;
  label: string;
  icon?: string;
  to?: string;
}
