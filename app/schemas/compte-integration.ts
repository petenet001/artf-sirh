import { z } from "zod";
import { agentSummarySchema } from "~/schemas/agent-summary";

/** Compte utilisateur provisionné pour un agent. Forme renvoyée par CompteIntegrationResource. */
export const compteIntegrationSchema = z.object({
  id: z.number(),
  agent_id: z.number().nullable().optional(),
  user_id: z.number().nullable().optional(),
  login: z.string().nullable().optional(),
  email_professionnel: z.string().nullable().optional(),
  badge_numero: z.string().nullable().optional(),
  mot_de_passe_provisoire_envoye: z.boolean().nullable().optional(),
  date_creation: z.string().nullable().optional(),
  agent: agentSummarySchema.optional(),
  created_at: z.string().optional(),
});

export type CompteIntegration = z.infer<typeof compteIntegrationSchema>;

/** Payload de provisionnement d'un compte (CompteIntegration/ProvisionnerRequest). */
export const compteProvisionnerSchema = z.object({
  agent_id: z.number(),
  dossier_integration_id: z.number().nullish(),
});

export type CompteProvisionnerInput = z.infer<typeof compteProvisionnerSchema>;
