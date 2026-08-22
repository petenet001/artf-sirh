import { z } from "zod";

/** Type de contrat (référentiel). Forme renvoyée par TypeContratResource. */
export const typeContratSchema = z.object({
  id: z.number(),
  nom: z.string(),
  sigle: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type TypeContrat = z.infer<typeof typeContratSchema>;

/** Payload de création/édition d'un type de contrat. */
export const typeContratInputSchema = z.object({
  nom: z.string().min(1),
  sigle: z.string().nullish(),
  description: z.string().nullish(),
});

export type TypeContratInput = z.infer<typeof typeContratInputSchema>;
