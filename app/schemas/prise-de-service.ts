import { z } from "zod";
import { agentSummarySchema } from "~/schemas/agent-summary";

/** Prise de service (étape finale). Forme renvoyée par PriseDeServiceResource. */
export const priseDeServiceSchema = z.object({
  id: z.number(),
  agent_id: z.number().optional(),
  agent: agentSummarySchema.optional(),
  dossier_integration_id: z.number().nullable().optional(),
  responsable_id: z.number().optional(),
  responsable: agentSummarySchema.optional(),
  date_prise_service: z.string().nullable().optional(),
  confirmation_presence: z.boolean().nullable().optional(),
  confirmation_installation: z.boolean().nullable().optional(),
  confirmation_equipements: z.boolean().nullable().optional(),
  pv_path: z.string().nullable().optional(),
  observations: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

export type PriseDeService = z.infer<typeof priseDeServiceSchema>;

/** Payload de création d'une prise de service. */
export const priseDeServiceInputSchema = z.object({
  agent_id: z.number(),
  dossier_integration_id: z.number().nullish(),
  responsable_id: z.number(),
  date_prise_service: z.string().min(1),
  confirmation_presence: z.boolean().nullish(),
  confirmation_installation: z.boolean().nullish(),
  confirmation_equipements: z.boolean().nullish(),
  observations: z.string().nullish(),
});

export type PriseDeServiceInput = z.infer<typeof priseDeServiceInputSchema>;
