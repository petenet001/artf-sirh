import { z } from "zod";
import { agentSocialSchema } from "~/schemas/affiliation-sociale";
import { catalogueFormationSchema } from "~/schemas/catalogue-formation";
import { STATUTS_INSCRIPTION_FORMATION } from "~/constants/enums";

/**
 * Inscription d'un agent à une formation.
 *
 * Règles portées par l'API (422) : agent archivé ou stagiaire, ancienneté
 * inférieure à `anciennete_min_ans` de la formation, plan non validé ou
 * formation absente de ses lignes. `admission_sur_titre` (art. 103) suppose un
 * âge ≤ 50 ans **et** le dernier échelon. La clôture d'un perfectionnement ou
 * d'une qualification exige `rapport_remis` (art. 100).
 */
export const inscriptionFormationSchema = z.object({
  id: z.number(),
  agent_id: z.number().optional(),
  agent: agentSocialSchema.nullable().optional(),
  formation_id: z.number().optional(),
  formation: catalogueFormationSchema.nullable().optional(),
  plan_id: z.number().nullable().optional(),
  date_inscription: z.string().nullable().optional(),
  date_debut: z.string().nullable().optional(),
  date_fin: z.string().nullable().optional(),
  statut: z.enum(STATUTS_INSCRIPTION_FORMATION).nullable().optional(),
  statut_label: z.string().nullable().optional(),
  admission_sur_titre: z.boolean().optional(),
  rapport_remis: z.boolean().optional(),
  // Engagement de service après la formation (art. 104).
  debit_jusqu_au: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

export type InscriptionFormation = z.infer<typeof inscriptionFormationSchema>;

export const inscriptionFormationInputSchema = z.object({
  agent_id: z.number(),
  formation_id: z.number(),
  plan_id: z.number().nullish(),
  date_inscription: z.string().nullish(),
  date_debut: z.string().nullish(),
  date_fin: z.string().nullish(),
  admission_sur_titre: z.boolean().nullish(),
  notes: z.string().nullish(),
});

export type InscriptionFormationInput = z.infer<typeof inscriptionFormationInputSchema>;

/** Clôture d'une inscription — rapport exigé pour perfectionnement / qualification. */
export const clotureInscriptionSchema = z.object({
  rapport_remis: z.boolean().nullish(),
  date_fin: z.string().nullish(),
});

export type ClotureInscriptionInput = z.infer<typeof clotureInscriptionSchema>;
