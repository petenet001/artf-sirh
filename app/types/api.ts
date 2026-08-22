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
