import { z } from "zod";
import { userSchema } from "~/schemas/auth";
import { NIVEAUX_VALIDATION } from "~/constants/enums";

/** Étape du circuit de validation. Forme renvoyée par ValidationWorkflowResource. */
export const validationWorkflowSchema = z.object({
  id: z.number(),
  niveau: z.enum(NIVEAUX_VALIDATION).nullable().optional(),
  niveau_label: z.string().nullable().optional(),
  ordre: z.number().nullable().optional(),
  statut: z.string(),
  commentaire: z.string().nullable().optional(),
  date_decision: z.string().nullable().optional(),
  validateur: userSchema.optional(),
  created_at: z.string().optional(),
});

export type ValidationWorkflow = z.infer<typeof validationWorkflowSchema>;

/** Payload de décision (approuver / renvoyer) — commentaire optionnel. */
export const validationDecisionSchema = z.object({
  commentaire: z.string().max(1000).nullish(),
});

/** Payload de rejet — commentaire requis. */
export const validationRejectionSchema = z.object({
  commentaire: z.string().min(1).max(1000),
});

export type ValidationDecisionInput = z.infer<typeof validationDecisionSchema>;
export type ValidationRejectionInput = z.infer<typeof validationRejectionSchema>;
