import { z } from "zod";
import { organismeSocialSchema } from "~/schemas/organisme-social";
import { STATUTS_AFFILIATION, STATUTS_AGENT } from "~/constants/enums";

/** Identité d'agent renvoyée par le module social (avec le numéro CNSS). */
export const agentSocialSchema = z.object({
  id: z.number(),
  matricule: z.string().nullable().optional(),
  nom: z.string().nullable().optional(),
  prenom: z.string().nullable().optional(),
  nom_complet: z.string().nullable().optional(),
  numero_cnss: z.string().nullable().optional(),
  statut: z.enum(STATUTS_AGENT).nullable().optional(),
});

export type AgentSocial = z.infer<typeof agentSocialSchema>;

/**
 * Affiliation d'un agent à un organisme social.
 *
 * Règles portées par l'API : une seule affiliation **active** par couple
 * agent + organisme ; une affiliation CNSS active écrit `agent.numero_cnss`
 * (et le reprend s'il n'est pas fourni) ; organisme inactif ou agent archivé
 * → 422.
 */
export const affiliationSocialeSchema = z.object({
  id: z.number(),
  agent_id: z.number().optional(),
  agent: agentSocialSchema.nullable().optional(),
  organisme_id: z.number().optional(),
  organisme: organismeSocialSchema.nullable().optional(),
  numero_affiliation: z.string().nullable().optional(),
  date_debut: z.string().nullable().optional(),
  date_fin: z.string().nullable().optional(),
  statut: z.enum(STATUTS_AFFILIATION).nullable().optional(),
  statut_label: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type AffiliationSociale = z.infer<typeof affiliationSocialeSchema>;

export const affiliationSocialeInputSchema = z.object({
  agent_id: z.number(),
  organisme_id: z.number(),
  // CNSS : laissé vide, l'API reprend `agent.numero_cnss`.
  numero_affiliation: z.string().max(50).nullish(),
  date_debut: z.string().min(1, "Date de début requise"),
  date_fin: z.string().nullish(),
  statut: z.enum(STATUTS_AFFILIATION).nullish(),
  notes: z.string().nullish(),
});

export type AffiliationSocialeInput = z.infer<typeof affiliationSocialeInputSchema>;
