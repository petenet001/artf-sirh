import { z } from "zod";
import { STATUTS_MATRIMONIAUX } from "~/constants/enums";

/**
 * Situation familiale de l'agent (vie courante). Forme renvoyée par
 * SituationFamilialeResource.
 */
export const situationFamilialeSchema = z.object({
  id: z.number(),
  agent_id: z.number(),
  statut_matrimonial: z.enum(STATUTS_MATRIMONIAUX).nullable().optional(),
  nb_enfants: z.number().nullable().optional(),
  updated_at: z.string().optional(),
});

export type SituationFamiliale = z.infer<typeof situationFamilialeSchema>;

/** Payload d'upsert (PUT). Tous les champs optionnels. */
export const situationFamilialeInputSchema = z.object({
  statut_matrimonial: z.enum(STATUTS_MATRIMONIAUX).nullish(),
  nb_enfants: z.number().int().min(0).max(30).nullish(),
});

export type SituationFamilialeInput = z.infer<typeof situationFamilialeInputSchema>;
