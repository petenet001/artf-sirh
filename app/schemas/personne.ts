import { z } from "zod";
import { GENRES } from "~/constants/enums";

/**
 * Socle commun à toute personne gérée par le SIRH, calé sur les champs réels
 * de l'API (cf. AgentResource / Agent\CreateRequest). `agentSchema` l'étend.
 * Une seule définition -> validation des formulaires ET inférence des types.
 */
export const personneSchema = z.object({
  id: z.number(),
  nom: z.string().min(1),
  prenom: z.string().min(1),
  date_naissance: z.string(),
  lieu_naissance: z.string().nullable().optional(),
  nationalite: z.string().nullable().optional(),
  genre: z.enum(GENRES),
  telephone: z.string().nullable().optional(),
  email_personnel: z.string().email().nullable().optional(),
});

export type Personne = z.infer<typeof personneSchema>;

/** Champs partagés pour la création/édition (sans les champs serveur). */
export const personneInputSchema = personneSchema.omit({ id: true });
export type PersonneInput = z.infer<typeof personneInputSchema>;
