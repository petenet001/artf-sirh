import { z } from "zod";
import { agentSummarySchema } from "~/schemas/agent-summary";
import { validationWorkflowSchema } from "~/schemas/validation-workflow";
import { STRUCTURABLE_TYPES } from "~/constants/enums";

/** Postes nominables (Nomination/CreateRequest). */
export const POSTES_NOMINATION = [
  "Directeur Général",
  "Directeur Central",
  "Directeur Départemental",
  "Chef de Service",
  "Chef de Bureau",
] as const;

/** Type d'acte d'une nomination (Nomination/CreateRequest). */
export const TYPES_ACTE_NOMINATION = ["arrete", "decision", "note_service"] as const;

/** Nomination d'un agent à un poste. Forme renvoyée par NominationResource. */
export const nominationSchema = z.object({
  id: z.number(),
  agent_id: z.number().optional(),
  agent: agentSummarySchema.optional(),
  poste: z.string().nullable().optional(),
  structurable_type: z.string().nullable().optional(),
  structurable_id: z.number().nullable().optional(),
  date_debut: z.string().nullable().optional(),
  date_fin: z.string().nullable().optional(),
  type_acte: z.string().nullable().optional(),
  statut: z.string().nullable().optional(),
  validations: z.array(validationWorkflowSchema).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Nomination = z.infer<typeof nominationSchema>;

/** Payload de création d'une nomination. */
export const nominationInputSchema = z.object({
  agent_id: z.number(),
  poste: z.enum(POSTES_NOMINATION),
  structurable_type: z.enum(STRUCTURABLE_TYPES),
  structurable_id: z.number(),
  date_debut: z.string().min(1),
  type_acte: z.enum(TYPES_ACTE_NOMINATION).nullish(),
});

export type NominationInput = z.infer<typeof nominationInputSchema>;
