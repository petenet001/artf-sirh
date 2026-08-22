import { z } from "zod";

/** Échelon (référentiel RH). Forme renvoyée par EchelonResource. */
export const echelonSchema = z.object({
  id: z.number(),
  nom: z.string(),
  numero: z.number(),
  description: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Echelon = z.infer<typeof echelonSchema>;

/** Payload de création/édition d'un échelon. */
export const echelonInputSchema = z.object({
  nom: z.string().min(1),
  numero: z.number().int().min(1),
  description: z.string().nullish(),
});

export type EchelonInput = z.infer<typeof echelonInputSchema>;
