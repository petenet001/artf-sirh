import { z } from "zod";
import { agentSummarySchema } from "~/schemas/agent-summary";
import { TYPES_POSITION, STATUTS_POSITION, ETAPES_POSITION } from "~/constants/enums";

/**
 * Position conventionnelle d'un agent (CCN art. 76–80) : détachement,
 * disponibilité, position exceptionnelle, sous le drapeau.
 *
 * ⚠️ Ces quatre statuts ne passent **plus** par `PUT /integration/agents/{id}`
 * (422 `errors.statut`) : ils s'obtiennent par ce circuit — la RH soumet, le DG
 * approuve, la RH clôture.
 *
 * `coupe_remuneration` vaut `true` pour le détachement et la disponibilité :
 * c'est l'effet le plus lourd, à rappeler avant l'approbation.
 */
export const positionConventionnelleSchema = z.object({
  id: z.number(),
  agent_id: z.number(),
  agent: agentSummarySchema.nullable().optional(),
  type: z.enum(TYPES_POSITION),
  type_label: z.string().nullable().optional(),
  // Article de la CCN ("78", "79", "80") — fourni par l'API.
  article: z.string().nullable().optional(),
  statut: z.enum(STATUTS_POSITION),
  statut_label: z.string().nullable().optional(),
  prochaine_etape: z.enum(ETAPES_POSITION).nullable().optional(),
  peut_renouveler: z.boolean().optional(),
  date_debut: z.string().nullable().optional(),
  date_fin: z.string().nullable().optional(),
  organisme_accueil: z.string().nullable().optional(),
  consentement_agent: z.boolean().optional(),
  // Détachement d'office : dispense du consentement et du préavis de 3 mois.
  detachement_office: z.boolean().optional(),
  nb_renouvellements: z.number().optional(),
  commentaire: z.string().nullable().optional(),
  piece_path: z.string().nullable().optional(),
  coupe_remuneration: z.boolean().optional(),
  // Présent à la clôture d'un détachement : signale l'absence d'affectation.
  reintegration: z
    .object({ affectation_manquante: z.boolean().optional() })
    .nullable()
    .optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type PositionConventionnelle = z.infer<typeof positionConventionnelleSchema>;

export const positionConventionnelleInputSchema = z.object({
  agent_id: z.number(),
  type: z.enum(TYPES_POSITION),
  date_debut: z.string().min(1, "Date de début requise"),
  date_fin: z.string().min(1, "Date de fin requise"),
  organisme_accueil: z.string().max(255).nullish(),
  consentement_agent: z.boolean().nullish(),
  detachement_office: z.boolean().nullish(),
  commentaire: z.string().max(2000).nullish(),
  piece_path: z.string().max(500).nullish(),
});

export type PositionConventionnelleInput = z.infer<typeof positionConventionnelleInputSchema>;

/** Approbation ou rejet par le DG (commentaire facultatif). */
export const traitementPositionSchema = z.object({
  commentaire: z.string().max(2000).nullish(),
});

/** Clôture par la RH — préavis de 3 mois pour détachement et disponibilité. */
export const cloturePositionSchema = z.object({
  date_fin: z.string().nullish(),
  commentaire: z.string().max(2000).nullish(),
});

/** Renouvellement par le DG (disponibilité : 2 fois au plus). */
export const renouvellementPositionSchema = z.object({
  date_debut: z.string().min(1, "Date de début requise"),
  date_fin: z.string().min(1, "Date de fin requise"),
});

export type TraitementPositionInput = z.infer<typeof traitementPositionSchema>;
export type ClosurePositionInput = z.infer<typeof cloturePositionSchema>;
export type RenouvellementPositionInput = z.infer<typeof renouvellementPositionSchema>;
