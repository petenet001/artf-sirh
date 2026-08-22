import { z } from "zod";

/** Motif administratif (référentiel). Forme renvoyée par MotifAdministratifResource. */
export const motifAdministratifSchema = z.object({
  id: z.number(),
  nom: z.string(),
  description: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type MotifAdministratif = z.infer<typeof motifAdministratifSchema>;

/** Payload de création/édition d'un motif administratif. */
export const motifAdministratifInputSchema = z.object({
  nom: z.string().min(1),
  description: z.string().nullish(),
});

export type MotifAdministratifInput = z.infer<typeof motifAdministratifInputSchema>;
