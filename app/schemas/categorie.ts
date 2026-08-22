import { z } from "zod";

/** Catégorie (référentiel RH). Forme renvoyée par CategorieResource. */
export const categorieSchema = z.object({
  id: z.number(),
  nom: z.string(),
  sigle: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Categorie = z.infer<typeof categorieSchema>;

/** Payload de création/édition d'une catégorie. */
export const categorieInputSchema = z.object({
  nom: z.string().min(1),
  sigle: z.string().nullish(),
  description: z.string().nullish(),
});

export type CategorieInput = z.infer<typeof categorieInputSchema>;
