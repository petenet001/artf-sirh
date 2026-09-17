import { z } from "zod";
import { TYPES_ACTION_FORMATION, MODALITES_FORMATION } from "~/constants/enums";

/**
 * Action de formation au catalogue (CCN art. 92–104).
 *
 * `duree_max_mois` est le plafond réglementaire du type d'action, calculé
 * serveur : 9 mois pour un perfectionnement (art. 99), 36 mois pour une
 * qualification ou une école (art. 102). `anciennete_min_ans` vaut 3 par défaut
 * (art. 92) ; `debit_formation_mois` fixe l'engagement de service après la
 * formation (art. 104) et produit `debit_jusqu_au` à l'inscription.
 */
export const catalogueFormationSchema = z.object({
  id: z.number(),
  titre: z.string(),
  description: z.string().nullable().optional(),
  organisme: z.string().nullable().optional(),
  lieu: z.string().nullable().optional(),
  modalite: z.enum(MODALITES_FORMATION).nullable().optional(),
  modalite_label: z.string().nullable().optional(),
  type_action: z.enum(TYPES_ACTION_FORMATION).nullable().optional(),
  type_action_label: z.string().nullable().optional(),
  duree_jours: z.number().nullable().optional(),
  duree_max_mois: z.number().nullable().optional(),
  cout: z.coerce.number().nullable().optional(),
  anciennete_min_ans: z.number().nullable().optional(),
  debit_formation_mois: z.number().nullable().optional(),
  actif: z.boolean().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type CatalogueFormation = z.infer<typeof catalogueFormationSchema>;

export const catalogueFormationInputSchema = z.object({
  titre: z.string().min(1, "Titre requis").max(255),
  description: z.string().nullish(),
  organisme: z.string().max(255).nullish(),
  lieu: z.string().max(255).nullish(),
  modalite: z.enum(MODALITES_FORMATION).nullish(),
  type_action: z.enum(TYPES_ACTION_FORMATION),
  duree_jours: z.coerce.number().min(1, "Durée d'au moins 1 jour").max(2000),
  cout: z.coerce.number().min(0).nullish(),
  anciennete_min_ans: z.coerce.number().min(0).max(10).nullish(),
  debit_formation_mois: z.coerce.number().min(1).max(60).nullish(),
  actif: z.boolean().nullish(),
});

export type CatalogueFormationInput = z.infer<typeof catalogueFormationInputSchema>;
