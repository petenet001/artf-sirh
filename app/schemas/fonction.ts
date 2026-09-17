import { z } from "zod";

/** Fonction (référentiel RH). Forme renvoyée par FonctionResource. */
export const fonctionSchema = z.object({
  id: z.number(),
  nom: z.string(),
  sigle: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  /** Fonction hors grille salariale (DG / DC / DD — art. 55). */
  hors_grille: z.boolean().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Fonction = z.infer<typeof fonctionSchema>;

/** Payload de création/édition d'une fonction. */
export const fonctionInputSchema = z.object({
  nom: z.string().min(1),
  sigle: z.string().nullish(),
  description: z.string().nullish(),
});

export type FonctionInput = z.infer<typeof fonctionInputSchema>;
