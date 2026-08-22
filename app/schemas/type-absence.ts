import { z } from "zod";

/** Type d'absence (référentiel). Forme renvoyée par TypeAbsenceResource. */
export const typeAbsenceSchema = z.object({
  id: z.number(),
  nom: z.string(),
  description: z.string().nullable().optional(),
  justification_requise: z.boolean().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type TypeAbsence = z.infer<typeof typeAbsenceSchema>;

/** Payload de création/édition d'un type d'absence. */
export const typeAbsenceInputSchema = z.object({
  nom: z.string().min(1),
  description: z.string().nullish(),
  justification_requise: z.boolean().nullish(),
});

export type TypeAbsenceInput = z.infer<typeof typeAbsenceInputSchema>;
