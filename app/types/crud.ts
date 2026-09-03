import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";

/**
 * Contrat minimal d'un repository CRUD (sous-ensemble de `use<Entite>Api`)
 * consommé par la primitive `BaseCrudManager`.
 */
export interface CrudRepo<T, I> {
  list: (params?: ListParams) => Promise<ApiCollection<T>>;
  create: (payload: I) => Promise<ApiResponse<T>>;
  update: (id: number, payload: Partial<I>) => Promise<ApiResponse<T>>;
  remove: (id: number) => Promise<unknown>;
}

/** Type de contrôle de formulaire rendu dynamiquement par `BaseCrudManager`. */
export type CrudFieldType = "text" | "textarea" | "number" | "switch" | "select" | "date";

/** Descripteur d'un champ de formulaire CRUD générique. */
export interface CrudField {
  /** Clé du champ — doit correspondre au schéma Zod d'entrée et à la ressource. */
  name: string;
  label: string;
  /** Défaut : "text". */
  type?: CrudFieldType;
  placeholder?: string;
  /** Options pour `type: "select"`. */
  options?: { label: string; value: string | number }[];
  help?: string;
}
