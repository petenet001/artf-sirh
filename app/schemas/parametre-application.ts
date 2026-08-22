import { z } from "zod";

/** Paramètre applicatif clé/valeur. Forme renvoyée par ParametreApplicationResource. */
export const parametreApplicationSchema = z.object({
  id: z.number(),
  cle: z.string(),
  valeur: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type ParametreApplication = z.infer<typeof parametreApplicationSchema>;

/** Payload de création/édition d'un paramètre applicatif (ParametreApplication/CreateRequest). */
export const parametreApplicationInputSchema = z.object({
  cle: z.string().min(1),
  valeur: z.string().nullish(),
  description: z.string().nullish(),
});

export type ParametreApplicationInput = z.infer<
  typeof parametreApplicationInputSchema
>;
