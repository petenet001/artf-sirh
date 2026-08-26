import { z } from "zod";
import { agentSummarySchema } from "~/schemas/agent-summary";
import { affectationSchema } from "~/schemas/affectation";
import { validationWorkflowSchema } from "~/schemas/validation-workflow";
import { STRUCTURABLE_TYPES, TYPES_ACTE_NOMINATION } from "~/constants/enums";

/** Postes nominables (Nomination/CreateRequest). Cohérence poste ↔ structure. */
export const POSTES_NOMINATION = [
  "Directeur Général",
  "Directeur Central",
  "Directeur Départemental",
  "Chef de Service",
  "Chef de Bureau",
] as const;

export { TYPES_ACTE_NOMINATION };

/** Structure morph résumée, jointe au détail d'une nomination. */
export const nominationStructureSchema = z.object({
  id: z.number(),
  nom: z.string().nullable().optional(),
  /** class_basename du structurable_type (Direction / Service / Bureau). */
  type: z.string().nullable().optional(),
});

/** Nomination d'un agent à un poste. Forme renvoyée par NominationResource. */
export const nominationSchema = z.object({
  id: z.number(),
  agent_id: z.number().optional(),
  agent: agentSummarySchema.optional(),
  /** Non nul si la nomination appartient à un lot groupé. */
  lot_nomination_id: z.number().nullable().optional(),
  poste: z.string().nullable().optional(),
  structurable_type: z.string().nullable().optional(),
  structurable_id: z.number().nullable().optional(),
  structure: nominationStructureSchema.optional(),
  date_debut: z.string().nullable().optional(),
  date_fin: z.string().nullable().optional(),
  type_acte: z.string().nullable().optional(),
  /** Libellé lisible de l'acte fourni par l'API (TypeActeNomination::label). */
  type_acte_label: z.string().nullable().optional(),
  statut: z.string().nullable().optional(),
  /** Libellé lisible fourni par l'API (StatutNomination::label). */
  statut_label: z.string().nullable().optional(),
  validations: z.array(validationWorkflowSchema).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Nomination = z.infer<typeof nominationSchema>;

/** Payload de création d'une nomination unitaire. */
export const nominationInputSchema = z.object({
  agent_id: z.number(),
  poste: z.enum(POSTES_NOMINATION),
  structurable_type: z.enum(STRUCTURABLE_TYPES),
  structurable_id: z.number(),
  date_debut: z.string().min(1),
  type_acte: z.enum(TYPES_ACTE_NOMINATION).nullish(),
});

export type NominationInput = z.infer<typeof nominationInputSchema>;

/**
 * Payload de mise à jour d'une nomination (Nomination/UpdateRequest).
 * Accepté uniquement tant que la nomination est `en_attente` (sinon 422).
 */
export const nominationUpdateSchema = z.object({
  poste: z.enum(POSTES_NOMINATION).optional(),
  structurable_type: z.enum(STRUCTURABLE_TYPES).optional(),
  structurable_id: z.number().optional(),
  date_debut: z.string().min(1).optional(),
  type_acte: z.enum(TYPES_ACTE_NOMINATION).nullish(),
});

export type NominationUpdate = z.infer<typeof nominationUpdateSchema>;

/** Une ligne d'un lot de nominations groupées (une structure par ligne). */
export const nominationGroupeeLigneSchema = z.object({
  agent_id: z.number(),
  poste: z.enum(POSTES_NOMINATION),
  structurable_type: z.enum(STRUCTURABLE_TYPES),
  structurable_id: z.number(),
});

export type NominationGroupeeLigne = z.infer<typeof nominationGroupeeLigneSchema>;

/** Payload d'un lot de nominations groupées (Nomination/GroupeeRequest). */
export const nominationGroupeeInputSchema = z.object({
  date_debut: z.string().min(1),
  type_acte: z.enum(TYPES_ACTE_NOMINATION).nullish(),
  agents: z.array(nominationGroupeeLigneSchema).min(2),
});

export type NominationGroupeeInput = z.infer<typeof nominationGroupeeInputSchema>;

/** Lot de nominations groupées. Forme renvoyée par LotNominationResource. */
export const lotNominationSchema = z.object({
  id: z.number(),
  date_debut: z.string().nullable().optional(),
  type_acte: z.string().nullable().optional(),
  type_acte_label: z.string().nullable().optional(),
  statut: z.string().nullable().optional(),
  statut_label: z.string().nullable().optional(),
  nominations: z.array(nominationSchema).optional(),
  validations: z.array(validationWorkflowSchema).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type LotNomination = z.infer<typeof lotNominationSchema>;

/**
 * Poste vacant : structure (Direction / Service / Bureau) sans nomination
 * active, renvoyée par `GET /carriere/nominations/postes-vacants`.
 */
export const posteVacantSchema = z.object({
  structurable_type: z.string(),
  structurable_id: z.number(),
  nom: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  postes_possibles: z.array(z.string()),
});

export type PosteVacant = z.infer<typeof posteVacantSchema>;

/**
 * Ligne hiérarchique d'un chef, renvoyée par
 * `GET /carriere/nominations/chefs/{id}/agents-sous-autorite`.
 */
export const agentsSousAutoriteSchema = z.object({
  chef: agentSummarySchema,
  nomination_active: nominationSchema.nullable().optional(),
  agents: z.array(
    z.object({
      agent: agentSummarySchema,
      affectation: affectationSchema,
    }),
  ),
});

export type AgentsSousAutorite = z.infer<typeof agentsSousAutoriteSchema>;
