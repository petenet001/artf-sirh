import { z } from "zod";

/**
 * Classe de la grille salariale (croisement catégorie × grade).
 * Forme renvoyée par ClassegrillesalarialeResource.
 * `categorie` et `grade` ne sont présents que si chargés (`whenLoaded`).
 */
export const classegrillesalarialeSchema = z.object({
  id: z.number(),
  coefficient: z.number(),
  categorie: z
    .object({
      id: z.number(),
      nom: z.string(),
      sigle: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  grade: z
    .object({
      id: z.number(),
      nom: z.string(),
      niveau: z.number().nullable().optional(),
    })
    .nullable()
    .optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Classegrillesalariale = z.infer<typeof classegrillesalarialeSchema>;

/** Payload de création/édition d'une classe de grille (Classegrillesalariale/CreateRequest). */
export const classegrillesalarialeInputSchema = z.object({
  categorie_id: z.number(),
  grade_id: z.number(),
  coefficient: z.number().int().min(1).max(500),
});

export type ClassegrillesalarialeInput = z.infer<
  typeof classegrillesalarialeInputSchema
>;
