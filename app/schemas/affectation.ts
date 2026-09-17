import { z } from "zod";
import { agentSummarySchema } from "~/schemas/agent-summary";
import { validationWorkflowSchema } from "~/schemas/validation-workflow";
import { STRUCTURABLE_TYPES, MOTIFS_AFFECTATION } from "~/constants/enums";

/** Affectation d'un agent à une structure. Forme renvoyée par AffectationResource. */
export const affectationSchema = z.object({
  id: z.number(),
  agent_id: z.number().optional(),
  agent: agentSummarySchema.optional(),
  /** Non nul si l'affectation appartient à un lot groupé (circuit/acte partagés). */
  lot_affectation_id: z.number().nullable().optional(),
  structurable_type: z.string().nullable().optional(),
  structurable_id: z.number().nullable().optional(),
  motif: z.string().nullable().optional(),
  /**
   * Motif codifié (art. 81–82). `rapprochement_conjoints` impose quatre pièces
   * et n'ouvre **aucun** accord automatique : l'opportunité reste appréciée.
   */
  motif_code: z.enum(MOTIFS_AFFECTATION).nullable().optional(),
  commentaire_opportunite: z.string().nullable().optional(),
  /** Pièces déposées au titre du rapprochement, par code de pièce. */
  pieces_rapprochement: z.record(z.string(), z.unknown()).nullable().optional(),
  note_service: z.string().nullable().optional(),
  note_service_nom_original: z.string().nullable().optional(),
  date_affectation: z.string().nullable().optional(),
  date_fin: z.string().nullable().optional(),
  statut: z.string().nullable().optional(),
  /** Libellé lisible fourni par l'API (StatutAffectation::label). */
  statut_label: z.string().nullable().optional(),
  superieur_hierarchique_id: z.number().nullable().optional(),
  superieur_hierarchique: agentSummarySchema.optional(),
  validations: z.array(validationWorkflowSchema).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Affectation = z.infer<typeof affectationSchema>;

/** Payload de création d'une affectation unitaire. */
export const affectationInputSchema = z.object({
  agent_id: z.number(),
  structurable_type: z.enum(STRUCTURABLE_TYPES),
  structurable_id: z.number(),
  motif: z.string().nullish(),
  note_service: z.string().nullish(),
  superieur_hierarchique_id: z.number().nullish(),
  date_affectation: z.string().min(1),
});

export type AffectationInput = z.infer<typeof affectationInputSchema>;

/** Une ligne d'un lot d'affectations groupées (une structure par agent). */
export const affectationGroupeeLigneSchema = z.object({
  agent_id: z.number(),
  structurable_type: z.enum(STRUCTURABLE_TYPES),
  structurable_id: z.number(),
  superieur_hierarchique_id: z.number().nullish(),
});

export type AffectationGroupeeLigne = z.infer<typeof affectationGroupeeLigneSchema>;

/**
 * Payload d'un lot d'affectations groupées (Affectation/GroupeeRequest).
 * Champs communs + au moins deux agents distincts. La note de service est un
 * fichier envoyé séparément en `FormData` (non couvert par ce schéma).
 */
export const affectationGroupeeInputSchema = z.object({
  date_affectation: z.string().min(1),
  motif: z.string().nullish(),
  agents: z.array(affectationGroupeeLigneSchema).min(2),
});

export type AffectationGroupeeInput = z.infer<typeof affectationGroupeeInputSchema>;

/** Lot d'affectations groupées. Forme renvoyée par LotAffectationResource. */
export const lotAffectationSchema = z.object({
  id: z.number(),
  date_affectation: z.string().nullable().optional(),
  motif: z.string().nullable().optional(),
  /**
   * Motif codifié (art. 81–82). `rapprochement_conjoints` impose quatre pièces
   * et n'ouvre **aucun** accord automatique : l'opportunité reste appréciée.
   */
  motif_code: z.enum(MOTIFS_AFFECTATION).nullable().optional(),
  commentaire_opportunite: z.string().nullable().optional(),
  /** Pièces déposées au titre du rapprochement, par code de pièce. */
  pieces_rapprochement: z.record(z.string(), z.unknown()).nullable().optional(),
  note_service: z.string().nullable().optional(),
  note_service_nom_original: z.string().nullable().optional(),
  statut: z.string().nullable().optional(),
  statut_label: z.string().nullable().optional(),
  total: z.number().optional(),
  affectations: z.array(affectationSchema).optional(),
  validations: z.array(validationWorkflowSchema).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type LotAffectation = z.infer<typeof lotAffectationSchema>;
