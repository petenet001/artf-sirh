import { z } from "zod";

/**
 * Coordonnées de l'agent (vie courante). Forme renvoyée par
 * InformationsPersonnelleResource. Le endpoint autonome renvoie `data: null`
 * tant que la fiche n'a pas été renseignée.
 */
export const informationsPersonnelleSchema = z.object({
  id: z.number(),
  agent_id: z.number(),
  adresse: z.string().nullable().optional(),
  quartier: z.string().nullable().optional(),
  ville: z.string().nullable().optional(),
  code_postal: z.string().nullable().optional(),
  pays: z.string().nullable().optional(),
  updated_at: z.string().optional(),
});

export type InformationsPersonnelle = z.infer<typeof informationsPersonnelleSchema>;

/** Payload d'upsert (PUT). Tous les champs optionnels. */
export const informationsPersonnelleInputSchema = z.object({
  adresse: z.string().max(255).nullish(),
  quartier: z.string().max(255).nullish(),
  ville: z.string().max(255).nullish(),
  code_postal: z.string().max(20).nullish(),
  pays: z.string().max(100).nullish(),
});

export type InformationsPersonnelleInput = z.infer<typeof informationsPersonnelleInputSchema>;
