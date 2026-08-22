import { z } from "zod";

/**
 * Paramètres globaux de la grille salariale (singleton).
 * Forme renvoyée par ParametregrileResource.
 */
export const parametregrilleSchema = z.object({
  id: z.number(),
  valeur_point_indice: z.number(),
  indice_base: z.number(),
  echelon_depart: z.number(),
  echelon_fin: z.number(),
  ecart_depart: z.number(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Parametregrille = z.infer<typeof parametregrilleSchema>;

/** Payload de mise à jour des paramètres de grille (Parametregrile/UpdateRequest, tout optionnel). */
export const parametregrilleInputSchema = z.object({
  valeur_point_indice: z.number().nullish(),
  indice_base: z.number().int().nullish(),
  echelon_depart: z.number().int().nullish(),
  echelon_fin: z.number().int().nullish(),
  ecart_depart: z.number().int().nullish(),
});

export type ParametregrilleInput = z.infer<typeof parametregrilleInputSchema>;
