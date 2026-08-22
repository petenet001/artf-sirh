import { z } from "zod";
import { typeDocumentSchema } from "~/schemas/type-document";

/** Type d'intégration (référentiel). Forme renvoyée par TypeIntegrationResource. */
export const typeIntegrationSchema = z.object({
  id: z.number(),
  nom: z.string(),
  description: z.string().nullable().optional(),
  type_acte_administratif: z.string().nullable().optional(),
  necessite_contrat: z.boolean().optional(),
  necessite_validation_dg: z.boolean().optional(),
  necessite_compte_utilisateur: z.boolean().optional(),
  prefixe_matricule: z.string().nullable().optional(),
  duree_max_mois: z.number().nullable().optional(),
  // Chargé uniquement sur le `show` (relation documentsObligatoires).
  documents_obligatoires: z.array(typeDocumentSchema).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type TypeIntegration = z.infer<typeof typeIntegrationSchema>;

/**
 * Payload de création/édition d'un type d'intégration (TypeIntegration/CreateRequest).
 * `documents_ids` = ids des types de documents obligatoires à rattacher.
 */
export const typeIntegrationInputSchema = z.object({
  nom: z.string().min(1),
  description: z.string().nullish(),
  documents_ids: z.array(z.number()).nullish(),
});

export type TypeIntegrationInput = z.infer<typeof typeIntegrationInputSchema>;
