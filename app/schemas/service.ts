import { z } from "zod";
import { structureRefSchema } from "~/schemas/structure-ref";

/** Service (structure organisationnelle). Forme renvoyée par ServiceResource. */
export const serviceSchema = z.object({
  id: z.number(),
  nom: z.string(),
  sigle: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  direction_id: z.number().nullable().optional(),
  direction: structureRefSchema.optional(),
  bureaux: z.array(structureRefSchema).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Service = z.infer<typeof serviceSchema>;

/** Payload de création/édition d'un service. */
export const serviceInputSchema = z.object({
  nom: z.string().min(1),
  sigle: z.string().nullish(),
  description: z.string().nullish(),
  direction_id: z.number().int(),
});

export type ServiceInput = z.infer<typeof serviceInputSchema>;
