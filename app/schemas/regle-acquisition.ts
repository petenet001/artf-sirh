import { z } from "zod";
import { typeCongeSchema } from "~/schemas/type-conge";

/**
 * Règle annuelle d'acquisition de congés par type (ex. 2,5 j/mois, plafond 30).
 * Forme renvoyée par RegleAcquisitionCongeResource.
 */
export const regleAcquisitionSchema = z.object({
  id: z.number(),
  type_conge_id: z.number(),
  type_conge: typeCongeSchema.optional(),
  jours_par_mois: z.number(),
  jours_max: z.number().nullable().optional(),
  created_at: z.string().optional(),
});

export type RegleAcquisition = z.infer<typeof regleAcquisitionSchema>;

/** Payload de création/édition d'une règle d'acquisition. */
export const regleAcquisitionInputSchema = z.object({
  type_conge_id: z.number(),
  jours_par_mois: z.number().min(0),
  jours_max: z.number().int().min(0).nullish(),
});

export type RegleAcquisitionInput = z.infer<typeof regleAcquisitionInputSchema>;
