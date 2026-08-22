import { z } from "zod";
import { agentSummarySchema } from "~/schemas/agent-summary";
import { userSchema } from "~/schemas/auth";

/** Remise de matériel à un agent. Forme renvoyée par RemiseMaterielResource. */
export const remiseMaterielSchema = z.object({
  id: z.number(),
  agent_id: z.number().optional(),
  agent: agentSummarySchema.optional(),
  affectation_id: z.number().nullable().optional(),
  materiel: z.array(z.string()).nullable().optional(),
  date_remise: z.string().nullable().optional(),
  remis_par: z.number().nullable().optional(),
  remiseur: userSchema.optional(),
  pv_path: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

export type RemiseMateriel = z.infer<typeof remiseMaterielSchema>;

/** Payload de création d'une remise de matériel. */
export const remiseMaterielInputSchema = z.object({
  agent_id: z.number(),
  affectation_id: z.number().nullish(),
  materiel: z.array(z.string()).min(1),
  date_remise: z.string().min(1),
});

export type RemiseMaterielInput = z.infer<typeof remiseMaterielInputSchema>;
