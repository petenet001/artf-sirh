import { z } from "zod";
import { structureRefSchema } from "~/schemas/structure-ref";

/** Bureau (structure organisationnelle). Forme renvoyée par BureauResource. */
export const bureauSchema = z.object({
  id: z.number(),
  nom: z.string(),
  sigle: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  service_id: z.number().nullable().optional(),
  service: structureRefSchema.optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Bureau = z.infer<typeof bureauSchema>;

/** Payload de création/édition d'un bureau. */
export const bureauInputSchema = z.object({
  nom: z.string().min(1),
  sigle: z.string().nullish(),
  description: z.string().nullish(),
  service_id: z.number().int(),
});

export type BureauInput = z.infer<typeof bureauInputSchema>;
