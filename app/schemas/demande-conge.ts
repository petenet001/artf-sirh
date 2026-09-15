import { z } from "zod";
import { agentSummarySchema } from "~/schemas/agent-summary";
import { typeCongeSchema } from "~/schemas/type-conge";
import { STATUTS_DEMANDE_CONGE, ETAPES_CONGE } from "~/constants/enums";

/**
 * Justificatif attaché à une demande. `url` pointe `GET
 * /api/conges/demandes/{id}/justificatif` (préfixe `/api` inclus) : le
 * téléchargement passe par le repository (`justificatif(id)`, blob + Bearer).
 */
export const justificatifCongeSchema = z.object({
  nom: z.string(),
  url: z.string().nullable().optional(),
});

/** Demande de congé. Forme renvoyée par DemandeCongeResource. */
export const demandeCongeSchema = z.object({
  id: z.number(),
  agent_id: z.number(),
  // Identité légère `{ id, matricule, nom, prenom, nom_complet }` (AgentIdentiteResource).
  agent: agentSummarySchema.nullable().optional(),
  type_conge_id: z.number(),
  type_conge: typeCongeSchema.optional(),
  date_debut: z.string().nullable().optional(),
  date_fin: z.string().nullable().optional(),
  // Calculé serveur (week-ends + fériés exclus) — jamais envoyé par le FE.
  nb_jours: z.number().nullable().optional(),
  motif: z.string().nullable().optional(),
  statut: z.enum(STATUTS_DEMANDE_CONGE).nullable().optional(),
  statut_label: z.string().nullable().optional(),
  commentaire_n1: z.string().nullable().optional(),
  commentaire_rh: z.string().nullable().optional(),
  commentaire_dg: z.string().nullable().optional(),
  date_validation_n1: z.string().nullable().optional(),
  date_validation_rh: z.string().nullable().optional(),
  date_validation_dg: z.string().nullable().optional(),
  // Étape en attente (source de vérité du bouton à afficher). Chargé avec typeConge.
  prochaine_etape: z.enum(ETAPES_CONGE).nullable().optional(),
  justificatif: justificatifCongeSchema.nullable().optional(),
  created_at: z.string().optional(),
});

export type DemandeConge = z.infer<typeof demandeCongeSchema>;

/**
 * Payload de soumission d'une demande. `nb_jours` et `statut` sont **calculés
 * serveur** : ne jamais les envoyer. Le `justificatif` (fichier) est géré à part
 * par le repository (multipart) quand le type l'exige.
 */
export const demandeCongeInputSchema = z.object({
  agent_id: z.number(),
  type_conge_id: z.number(),
  date_debut: z.string().min(1),
  date_fin: z.string().min(1),
  motif: z.string().nullish(),
});

export type DemandeCongeInput = z.infer<typeof demandeCongeInputSchema>;

/** Payload de validation (commentaire optionnel). */
export const decisionCongeSchema = z.object({
  commentaire: z.string().max(1000).nullish(),
});

/** Payload de rejet (commentaire requis, min. 3 caractères — sinon 422). */
export const rejetCongeSchema = z.object({
  commentaire: z.string().min(3, "Motif requis (3 caractères min.)").max(1000),
});

export type DecisionCongeInput = z.infer<typeof decisionCongeSchema>;
export type RejetCongeInput = z.infer<typeof rejetCongeSchema>;
