/**
 * Types transverses de l'API backend (Laravel).
 * Définis une seule fois et réutilisés par toute la couche `api/`.
 *
 * L'API réelle n'utilise PAS de pagination : `index` renvoie une collection
 * plate `{ data: [...] }`. Le filtrage se fait par égalité exacte sur des
 * champs whitelistés, passés en query (`?nom=...&statut=...`).
 */

/** Réponse contenant une ressource unique (`{ data, message? }`). */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/** Réponse contenant une collection (tableau plat, sans métadonnées). */
export interface ApiCollection<T> {
  data: T[];
}

/**
 * Métadonnées de pagination. **Exception** au principe « pas de pagination » :
 * seul l'inbox notifications pagine (volume potentiellement élevé, consommé par
 * lots dans la cloche). Le reste de l'API reste en collection plate.
 */
export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

/** Réponse paginée `{ data, meta, message? }`. `M` étend la meta si besoin. */
export interface Paginated<T, M extends PaginationMeta = PaginationMeta> {
  data: T[];
  meta: M;
  message?: string;
}

/** Corps d'erreur renvoyé par le backend (validation 422 incluse). */
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

/**
 * Paramètres de filtrage d'un endpoint de liste.
 * Chaque ressource expose ses propres champs filtrables (égalité exacte).
 */
export type ListParams = Record<string, string | number | boolean | undefined>;
