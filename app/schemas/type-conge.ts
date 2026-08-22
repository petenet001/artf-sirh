import { z } from "zod";

/** Type de congé (référentiel). Forme renvoyée par TypeCongeResource. */
export const typeCongeSchema = z.object({
  id: z.number(),
  nom: z.string(),
  description: z.string().nullable().optional(),
  jours_max: z.number().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type TypeConge = z.infer<typeof typeCongeSchema>;

/** Payload de création/édition d'un type de congé. */
export const typeCongeInputSchema = z.object({
  nom: z.string().min(1),
  description: z.string().nullish(),
  jours_max: z.number().int().min(0).nullish(),
});

export type TypeCongeInput = z.infer<typeof typeCongeInputSchema>;
