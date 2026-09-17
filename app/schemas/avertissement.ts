import { z } from "zod";
import { agentSummarySchema } from "~/schemas/agent-summary";
import { sanctionSchema } from "~/schemas/sanction";

/**
 * Avertissement simple : mesure de la RH, hors circuit disciplinaire (pas
 * d'instruction ni de prononcé). Compte néanmoins dans l'historique de l'agent.
 */
export const avertissementSchema = z.object({
  id: z.number(),
  agent_id: z.number(),
  agent: agentSummarySchema.nullable().optional(),
  motif: z.string(),
  date: z.string().nullable().optional(),
  emetteur_id: z.number().nullable().optional(),
  emetteur: z.object({ id: z.number().nullable(), name: z.string().nullable() }).nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Avertissement = z.infer<typeof avertissementSchema>;

export const avertissementInputSchema = z.object({
  agent_id: z.number(),
  motif: z.string().min(3, "Motif requis (3 caractères min.)"),
  date: z.string().min(1, "Date requise"),
});

export type AvertissementInput = z.infer<typeof avertissementInputSchema>;

/**
 * Historique disciplinaire d'un agent (`/discipline/agents/{id}/historique` et
 * `/discipline/moi/historique`) : sanctions, avertissements et indicateur de
 * récidive sur 5 ans, en une seule réponse.
 */
export const historiqueDisciplinaireSchema = z.object({
  sanctions: z.array(sanctionSchema),
  avertissements: z.array(avertissementSchema),
  recidive: z.boolean().nullable().optional(),
});

export type HistoriqueDisciplinaire = z.infer<typeof historiqueDisciplinaireSchema>;
