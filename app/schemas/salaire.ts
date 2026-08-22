import { z } from "zod";

/**
 * Ligne de la grille salariale calculée (échelon × indice × salaire).
 * Forme renvoyée par SalaireResource. `classe` n'est présent que si chargé.
 */
export const salaireSchema = z.object({
  id: z.number(),
  echelon: z.number(),
  indice: z.number(),
  salaire: z.number(),
  classe: z
    .object({
      id: z.number(),
      coefficient: z.number(),
      categorie: z.object({
        id: z.number(),
        nom: z.string(),
        sigle: z.string().nullable().optional(),
      }),
      grade: z.object({
        id: z.number(),
        nom: z.string(),
        niveau: z.number().nullable().optional(),
      }),
    })
    .nullable()
    .optional(),
});

export type Salaire = z.infer<typeof salaireSchema>;

/**
 * Payload de génération de la grille salariale (Salaire/GenerateRequest).
 * Si `valeur_point_indice` est absent, l'API lit la valeur des paramètres de grille.
 */
export const salaireGenerateSchema = z.object({
  valeur_point_indice: z.number().nullish(),
});

export type SalaireGenerate = z.infer<typeof salaireGenerateSchema>;
