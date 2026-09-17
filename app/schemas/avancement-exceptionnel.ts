import { z } from "zod";
import { agentSummarySchema } from "~/schemas/agent-summary";
import { STATUTS_BONIFICATION } from "~/constants/enums";

/**
 * Avancement exceptionnel (CCN art. 72) : 1 ou 2 échelons accordés par la
 * commission d'avancement sur proposition du DG, hors cycle de notation.
 * Partage le cycle de statut de la bonification de stage (`StatutBonification`).
 */
export const avancementExceptionnelSchema = z.object({
  id: z.number(),
  agent_id: z.number(),
  agent: agentSummarySchema.nullable().optional(),
  commission_avancement_id: z.number().nullable().optional(),
  nb_echelons: z.number().nullable().optional(),
  motif: z.string().nullable().optional(),
  date_proposition: z.string().nullable().optional(),
  statut: z.enum(STATUTS_BONIFICATION),
  statut_label: z.string().nullable().optional(),
  commentaire: z.string().nullable().optional(),
  traite_le: z.string().nullable().optional(),
  applique_le: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

export type AvancementExceptionnel = z.infer<typeof avancementExceptionnelSchema>;

/** Proposition (DG). `nb_echelons` : 1 ou 2 seulement — 422 sinon. */
export const avancementExceptionnelInputSchema = z.object({
  agent_id: z.number(),
  nb_echelons: z.coerce.number().min(1, "1 ou 2 échelons").max(2, "1 ou 2 échelons"),
  motif: z.string().min(10, "Motif requis (10 caractères min.)").max(2000),
  commission_avancement_id: z.number().nullish(),
  date_proposition: z.string().nullish(),
});

export type AvancementExceptionnelInput = z.infer<typeof avancementExceptionnelInputSchema>;
