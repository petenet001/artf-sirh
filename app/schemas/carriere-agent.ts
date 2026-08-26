import { z } from "zod";
import { STATUTS_AGENT } from "~/constants/enums";
import { contratSchema } from "~/schemas/contrat";
import { affectationSchema } from "~/schemas/affectation";
import { nominationSchema } from "~/schemas/nomination";
import { salaireAgentSchema } from "~/schemas/salaire-agent";

/**
 * Synthèse carrière d'un agent — `GET /carriere/agents/{id}` (CarriereAgentResource).
 * Agrège les situations administratives *actives* de l'agent. Chaque bloc est
 * `null` si aucun n'est en cours. Pas d'alias `/integration` (conflit avec la
 * fiche agent). Distinct de `agentSummarySchema` (résumé imbriqué).
 */
export const carriereAgentSchema = z.object({
  id: z.number(),
  matricule: z.string().nullable().optional(),
  nom: z.string(),
  prenom: z.string(),
  statut: z.enum(STATUTS_AGENT).nullable().optional(),
  contrat_actif: contratSchema.nullable().optional(),
  affectation_active: affectationSchema.nullable().optional(),
  nomination_active: nominationSchema.nullable().optional(),
  salaire_actuel: salaireAgentSchema.nullable().optional(),
});

export type CarriereAgent = z.infer<typeof carriereAgentSchema>;
