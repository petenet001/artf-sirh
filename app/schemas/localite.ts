import { z } from "zod";
import { structureRefSchema } from "~/schemas/structure-ref";

/** Localité (structure organisationnelle). Forme renvoyée par LocaliteResource. */
export const localiteSchema = z.object({
  id: z.number(),
  nom: z.string(),
  sigle: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  administrations: z.array(structureRefSchema).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Localite = z.infer<typeof localiteSchema>;

/** Payload de création/édition d'une localité. */
export const localiteInputSchema = z.object({
  nom: z.string().min(1),
  sigle: z.string().nullish(),
  description: z.string().nullish(),
});

export type LocaliteInput = z.infer<typeof localiteInputSchema>;
