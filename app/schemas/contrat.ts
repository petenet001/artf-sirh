import { z } from "zod";
import { agentSummarySchema } from "~/schemas/agent-summary";
import { typeContratSchema } from "~/schemas/type-contrat";
import { fonctionSchema } from "~/schemas/fonction";

/** Contrat d'un agent. Forme renvoyée par ContratResource. */
export const contratSchema = z.object({
  id: z.number(),
  agent_id: z.number().optional(),
  agent: agentSummarySchema.optional(),
  type_contrat_id: z.number().optional(),
  type_contrat: typeContratSchema.optional(),
  fonction_id: z.number().nullable().optional(),
  fonction: fonctionSchema.optional(),
  date_debut: z.string().nullable().optional(),
  date_fin: z.string().nullable().optional(),
  remuneration: z.union([z.string(), z.number()]).nullable().optional(),
  statut: z.string().nullable().optional(),
  dossier_integration_id: z.number().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Contrat = z.infer<typeof contratSchema>;

/** Payload de création d'un contrat. */
export const contratInputSchema = z.object({
  agent_id: z.number(),
  type_contrat_id: z.number(),
  dossier_integration_id: z.number().nullish(),
  fonction_id: z.number().nullish(),
  date_debut: z.string().min(1),
  date_fin: z.string().nullish(),
  remuneration: z.number().min(0).nullish(),
});

export type ContratInput = z.infer<typeof contratInputSchema>;
