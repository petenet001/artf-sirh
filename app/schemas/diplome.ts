import { z } from "zod";

/** Résumé de classe de grille rattachée à un diplôme (expansion serveur). */
const classeGrilleResumeSchema = z.object({
  id: z.number(),
  coefficient: z.number(),
  categorie: z.string().nullable().optional(),
  categorie_id: z.number().nullable().optional(),
  grade: z.string().nullable().optional(),
  grade_id: z.number().nullable().optional(),
});

/** Diplôme (référentiel RH). Forme renvoyée par DiplomeResource. */
export const diplomeSchema = z.object({
  id: z.number(),
  nom: z.string(),
  sigle: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  classegrillesalariale_id: z.number().nullable().optional(),
  classe_grille: classeGrilleResumeSchema.nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Diplome = z.infer<typeof diplomeSchema>;

/** Payload de création/édition d'un diplôme. */
export const diplomeInputSchema = z.object({
  nom: z.string().min(1),
  sigle: z.string().nullish(),
  description: z.string().nullish(),
});

export type DiplomeInput = z.infer<typeof diplomeInputSchema>;
