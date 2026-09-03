import { z } from "zod";
import { agentSchema } from "~/schemas/agent";
import { typeAbsenceSchema } from "~/schemas/type-absence";
import { STATUTS_ABSENCE } from "~/constants/enums";

/** Absence d'un agent (circuit unique : en_attente → validee / rejetee). */
export const absenceSchema = z.object({
  id: z.number(),
  agent_id: z.number(),
  agent: agentSchema.optional(),
  type_absence_id: z.number(),
  type_absence: typeAbsenceSchema.optional(),
  date_debut: z.string().nullable().optional(),
  date_fin: z.string().nullable().optional(),
  // Calculé serveur comme pour les congés (week-ends + fériés exclus).
  nb_jours: z.number().nullable().optional(),
  justifiee: z.boolean().nullable().optional(),
  motif: z.string().nullable().optional(),
  statut: z.enum(STATUTS_ABSENCE).nullable().optional(),
  statut_label: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

export type Absence = z.infer<typeof absenceSchema>;

/**
 * Payload de déclaration d'une absence. `motif` devient obligatoire côté serveur
 * quand le type a `justification_requise` (le formulaire l'exige alors aussi).
 */
export const absenceInputSchema = z.object({
  agent_id: z.number(),
  type_absence_id: z.number(),
  date_debut: z.string().min(1),
  date_fin: z.string().min(1),
  justifiee: z.boolean().nullish(),
  motif: z.string().nullish(),
});

export type AbsenceInput = z.infer<typeof absenceInputSchema>;

/** Payload de rejet d'une absence (commentaire requis). */
export const rejetAbsenceSchema = z.object({
  commentaire: z.string().min(1, "Motif requis").max(1000),
});

export type RejetAbsenceInput = z.infer<typeof rejetAbsenceSchema>;
