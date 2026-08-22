import { z } from "zod";
import { agentSummarySchema } from "~/schemas/agent-summary";
import { validationWorkflowSchema } from "~/schemas/validation-workflow";
import { STRUCTURABLE_TYPES } from "~/constants/enums";

/** Affectation d'un agent à une structure. Forme renvoyée par AffectationResource. */
export const affectationSchema = z.object({
  id: z.number(),
  agent_id: z.number().optional(),
  agent: agentSummarySchema.optional(),
  structurable_type: z.string().nullable().optional(),
  structurable_id: z.number().nullable().optional(),
  motif: z.string().nullable().optional(),
  note_service: z.string().nullable().optional(),
  date_affectation: z.string().nullable().optional(),
  date_fin: z.string().nullable().optional(),
  statut: z.string().nullable().optional(),
  superieur_hierarchique_id: z.number().nullable().optional(),
  superieur_hierarchique: agentSummarySchema.optional(),
  validations: z.array(validationWorkflowSchema).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Affectation = z.infer<typeof affectationSchema>;

/** Payload de création d'une affectation. */
export const affectationInputSchema = z.object({
  agent_id: z.number(),
  structurable_type: z.enum(STRUCTURABLE_TYPES),
  structurable_id: z.number(),
  motif: z.string().nullish(),
  note_service: z.string().nullish(),
  superieur_hierarchique_id: z.number().nullish(),
  date_affectation: z.string().min(1),
});

export type AffectationInput = z.infer<typeof affectationInputSchema>;
