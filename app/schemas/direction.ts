import { z } from "zod";
import { structureRefSchema } from "~/schemas/structure-ref";

/** Direction (structure organisationnelle). Forme renvoyée par DirectionResource. */
export const directionSchema = z.object({
  id: z.number(),
  nom: z.string(),
  sigle: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  administration_id: z.number().nullable().optional(),
  administration: structureRefSchema.optional(),
  services: z.array(structureRefSchema).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Direction = z.infer<typeof directionSchema>;

/** Payload de création/édition d'une direction. */
export const directionInputSchema = z.object({
  nom: z.string().min(1),
  sigle: z.string().nullish(),
  description: z.string().nullish(),
  administration_id: z.number().int(),
});

export type DirectionInput = z.infer<typeof directionInputSchema>;
