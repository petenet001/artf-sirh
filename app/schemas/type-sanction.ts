import { z } from "zod";
import { GRAVITES_SANCTION, CODES_TYPE_SANCTION } from "~/constants/enums";

/**
 * Type de sanction (CCN art. 90). Le `code` identifie les quatre types
 * réglementaires ; `exige_nb_jours` (mise à pied) impose une durée de 1 à 8
 * jours à la création du dossier.
 */
export const typeSanctionSchema = z.object({
  id: z.number(),
  nom: z.string(),
  code: z.enum(CODES_TYPE_SANCTION).nullable().optional(),
  gravite: z.enum(GRAVITES_SANCTION).nullable().optional(),
  gravite_label: z.string().nullable().optional(),
  exige_nb_jours: z.boolean().optional(),
  nb_jours_min: z.number().nullable().optional(),
  nb_jours_max: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
  actif: z.boolean().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type TypeSanction = z.infer<typeof typeSanctionSchema>;

/** ⚠️ Un type CCN ne peut pas être supprimé (422) : le désactiver à la place. */
export const typeSanctionInputSchema = z.object({
  nom: z.string().min(1, "Nom requis").max(255),
  code: z.enum(CODES_TYPE_SANCTION).nullish(),
  gravite: z.enum(GRAVITES_SANCTION),
  exige_nb_jours: z.boolean().nullish(),
  nb_jours_min: z.coerce.number().min(1).max(8).nullish(),
  nb_jours_max: z.coerce.number().min(1).max(8).nullish(),
  description: z.string().nullish(),
  actif: z.boolean().nullish(),
});

export type TypeSanctionInput = z.infer<typeof typeSanctionInputSchema>;
