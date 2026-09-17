import { z } from "zod";
import { agentSocialSchema } from "~/schemas/affiliation-sociale";
import { paieElementSchema } from "~/schemas/paie-element";
import { ZONES_INDEMNITE_FORMATION, CAUSES_PROLONGATION_INTERIM } from "~/constants/enums";

/**
 * Affectation d'un élément de paie à un agent, sur une période.
 *
 * Les éléments **automatiques** (ancienneté, 13ᵉ mois, rentrée scolaire, arbre
 * de Noël) n'y figurent jamais : le lot les calcule seul (422 si on essaie).
 * Une affectation déjà figée dans un lot validé ou clôturé n'est plus
 * modifiable ni supprimable.
 */
export const paieAffectationSchema = z.object({
  id: z.number(),
  agent_id: z.number(),
  agent: agentSocialSchema.nullable().optional(),
  paie_element_id: z.number(),
  element: paieElementSchema.nullable().optional(),
  montant: z.number().nullable().optional(),
  taux: z.number().nullable().optional(),
  quantite: z.number().nullable().optional(),
  date_debut: z.string().nullable().optional(),
  date_fin: z.string().nullable().optional(),
  motif: z.string().nullable().optional(),
  /** Autorise un intérim ou une mission au-delà du plafond conventionnel. */
  prolongation_dg: z.boolean().optional(),
  meta: z.record(z.string(), z.unknown()).nullable().optional(),
  /** Période en cours à la date du jour (calculé serveur). */
  active: z.boolean().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type PaieAffectation = z.infer<typeof paieAffectationSchema>;

export const paieAffectationInputSchema = z.object({
  agent_id: z.number(),
  paie_element_id: z.number(),
  // Obligatoire si l'élément est à montant fixe sans `montant_defaut`.
  montant: z.coerce.number().min(0).nullish(),
  taux: z.coerce.number().min(0).max(100).nullish(),
  // Obligatoire pour une périodicité journalière ou un barème de mission.
  quantite: z.coerce.number().min(0).nullish(),
  date_debut: z.string().min(1, "Date de début requise"),
  date_fin: z.string().nullish(),
  // Obligatoire pour une prime exceptionnelle.
  motif: z.string().nullish(),
  prolongation_dg: z.boolean().nullish(),
  // Indemnité de formation : hors Afrique, le montant (SMIG local) est exigé.
  zone: z.enum(ZONES_INDEMNITE_FORMATION).nullish(),
  // Intérim au-delà de 6 mois : seule la maladie ou l'accident du travail l'autorise.
  cause: z.enum(CAUSES_PROLONGATION_INTERIM).nullish(),
});

export type PaieAffectationInput = z.infer<typeof paieAffectationInputSchema>;
