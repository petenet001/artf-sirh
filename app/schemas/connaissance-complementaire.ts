import { z } from "zod";
import { TYPES_CONNAISSANCE } from "~/constants/enums";

/**
 * Besoin de formation relevé pendant l'évaluation (Phase 5.3). Rattaché à la
 * fiche : c'est la passerelle vers le plan de formation.
 */
export const connaissanceComplementaireSchema = z.object({
  id: z.number(),
  evaluation_id: z.number(),
  type: z.enum(TYPES_CONNAISSANCE),
  domaine: z.string(),
  description: z.string().nullable().optional(),
  urgent: z.boolean().optional(),
  created_at: z.string().optional(),
});

export type ConnaissanceComplementaire = z.infer<typeof connaissanceComplementaireSchema>;

export const connaissanceComplementaireInputSchema = z.object({
  type: z.enum(TYPES_CONNAISSANCE),
  domaine: z.string().min(1, "Domaine requis").max(255),
  description: z.string().max(2000).nullish(),
  urgent: z.boolean().nullish(),
});

export type ConnaissanceComplementaireInput = z.infer<typeof connaissanceComplementaireInputSchema>;
