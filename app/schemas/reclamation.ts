import { z } from "zod";
import { agentSummarySchema } from "~/schemas/agent-summary";
import { STATUTS_RECLAMATION } from "~/constants/enums";

/**
 * Réclamation de l'agent sur sa note (CCN art. 65, ReclamationResource).
 * Déposée après la signature de l'agent ; la RH l'accepte (retour au notateur)
 * ou la rejette (note maintenue, fiche transmise en validation RH).
 */
export const reclamationSchema = z.object({
  id: z.number(),
  evaluation_id: z.number(),
  agent_id: z.number(),
  agent: agentSummarySchema.nullable().optional(),
  motif: z.string(),
  statut: z.enum(STATUTS_RECLAMATION),
  statut_label: z.string().nullable().optional(),
  commentaire_rh: z.string().nullable().optional(),
  traite_le: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

export type Reclamation = z.infer<typeof reclamationSchema>;

/** Dépôt d'une réclamation par l'agent (`POST evaluations/{id}/reclamer`). */
export const reclamationInputSchema = z.object({
  motif: z.string().min(10, "Motif requis (10 caractères min.)").max(2000),
});

export type ReclamationInput = z.infer<typeof reclamationInputSchema>;

/** Traitement RH (`POST reclamations/{id}/traiter`). */
export const traitementReclamationSchema = z.object({
  acceptee: z.boolean(),
  commentaire: z.string().max(2000).nullish(),
});

export type TraitementReclamationInput = z.infer<typeof traitementReclamationSchema>;
