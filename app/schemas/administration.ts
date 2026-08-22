import { z } from "zod";
import { structureRefSchema } from "~/schemas/structure-ref";

/** Administration (structure organisationnelle). Forme renvoyée par AdministrationResource. */
export const administrationSchema = z.object({
  id: z.number(),
  nom: z.string(),
  sigle: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  localite_id: z.number().nullable().optional(),
  localite: structureRefSchema.optional(),
  directions: z.array(structureRefSchema).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Administration = z.infer<typeof administrationSchema>;

/** Payload de création/édition d'une administration. */
export const administrationInputSchema = z.object({
  nom: z.string().min(1),
  sigle: z.string().nullish(),
  description: z.string().nullish(),
  localite_id: z.number().int(),
});

export type AdministrationInput = z.infer<typeof administrationInputSchema>;
