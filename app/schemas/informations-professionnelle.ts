import { z } from "zod";
import { diplomeSchema } from "~/schemas/diplome";

/**
 * Profil professionnel de l'agent (vie courante). Forme renvoyée par
 * InformationsProfessionnelleResource. `diplome` n'est présent que si chargé,
 * sinon `diplome_id` seul.
 */
export const informationsProfessionnelleSchema = z.object({
  id: z.number(),
  agent_id: z.number(),
  diplome_id: z.number().nullable().optional(),
  diplome: diplomeSchema.optional(),
  niveau_etude: z.string().nullable().optional(),
  specialite: z.string().nullable().optional(),
  annees_experience: z.number().nullable().optional(),
  etablissement: z.string().nullable().optional(),
  updated_at: z.string().optional(),
});

export type InformationsProfessionnelle = z.infer<typeof informationsProfessionnelleSchema>;

/** Payload d'upsert (PUT). Tous les champs optionnels. */
export const informationsProfessionnelleInputSchema = z.object({
  diplome_id: z.number().nullish(),
  niveau_etude: z.string().max(100).nullish(),
  specialite: z.string().max(255).nullish(),
  annees_experience: z.number().int().min(0).max(70).nullish(),
  etablissement: z.string().max(255).nullish(),
});

export type InformationsProfessionnelleInput = z.infer<typeof informationsProfessionnelleInputSchema>;
