import { z } from "zod";

/** Contact d'urgence d'un agent. Forme renvoyée par ContactUrgenceResource. */
export const contactUrgenceSchema = z.object({
  id: z.number(),
  agent_id: z.number(),
  nom: z.string(),
  prenom: z.string(),
  telephone: z.string(),
  relation: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

export type ContactUrgence = z.infer<typeof contactUrgenceSchema>;

/** Payload de création/édition d'un contact d'urgence. */
export const contactUrgenceInputSchema = z.object({
  nom: z.string().min(1).max(255),
  prenom: z.string().min(1).max(255),
  telephone: z.string().min(1).max(20),
  relation: z.string().max(100).nullish(),
});

export type ContactUrgenceInput = z.infer<typeof contactUrgenceInputSchema>;
