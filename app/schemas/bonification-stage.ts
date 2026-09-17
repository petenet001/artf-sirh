import { z } from "zod";
import { agentSummarySchema } from "~/schemas/agent-summary";
import { STATUTS_BONIFICATION, TYPES_DOCUMENT_BONIFICATION } from "~/constants/enums";

/**
 * Bonification de stage (CCN art. 71) : +2 échelons pour un stage autorisé d'au
 * moins 9 mois, justifié par un certificat ou une attestation. Parcours
 * **séparé** du cycle de notation de 24 mois.
 */
export const bonificationStageSchema = z.object({
  id: z.number(),
  agent_id: z.number(),
  agent: agentSummarySchema.nullable().optional(),
  date_debut_stage: z.string().nullable().optional(),
  date_fin_stage: z.string().nullable().optional(),
  // Calculée serveur depuis les deux dates ; 422 en deçà de 9 mois.
  duree_mois: z.coerce.number().nullable().optional(),
  type_document: z.enum(TYPES_DOCUMENT_BONIFICATION).nullable().optional(),
  reference_document: z.string().nullable().optional(),
  nb_echelons: z.number().nullable().optional(),
  statut: z.enum(STATUTS_BONIFICATION),
  statut_label: z.string().nullable().optional(),
  commentaire: z.string().nullable().optional(),
  traite_le: z.string().nullable().optional(),
  applique_le: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

export type BonificationStage = z.infer<typeof bonificationStageSchema>;

/** Dépôt d'une demande. `duree_mois` et `nb_echelons` sont calculés serveur. */
export const bonificationStageInputSchema = z.object({
  agent_id: z.number(),
  date_debut_stage: z.string().min(1, "Date de début requise"),
  date_fin_stage: z.string().min(1, "Date de fin requise"),
  type_document: z.enum(TYPES_DOCUMENT_BONIFICATION),
  reference_document: z.string().max(255).nullish(),
});

export type BonificationStageInput = z.infer<typeof bonificationStageInputSchema>;

/**
 * Décision RH sur une demande (bonification **ou** avancement exceptionnel :
 * l'API partage le même payload et le même enum de statut).
 */
export const traitementBonificationSchema = z.object({
  approuver: z.boolean(),
  commentaire: z.string().max(2000).nullish(),
});

export type TraitementBonificationInput = z.infer<typeof traitementBonificationSchema>;
