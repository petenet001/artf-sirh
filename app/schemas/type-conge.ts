import { z } from "zod";

/** Type de congé (référentiel). Forme renvoyée par TypeCongeResource. */
export const typeCongeSchema = z.object({
  id: z.number(),
  nom: z.string(),
  description: z.string().nullable().optional(),
  jours_max: z.number().nullable().optional(),
  // Flags qui pilotent le circuit et le formulaire (cf. note FE §2c). `necessite_*`
  // détermine les étapes ; `debite_solde` affiche/contrôle le solde ;
  // `justificatif_requis` force le fichier (POST en multipart).
  necessite_n1: z.boolean().nullable().optional(),
  necessite_rh: z.boolean().nullable().optional(),
  necessite_dg: z.boolean().nullable().optional(),
  debite_solde: z.boolean().nullable().optional(),
  justificatif_requis: z.boolean().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type TypeConge = z.infer<typeof typeCongeSchema>;

/** Payload de création/édition d'un type de congé. */
export const typeCongeInputSchema = z.object({
  nom: z.string().min(1),
  description: z.string().nullish(),
  jours_max: z.number().int().min(0).nullish(),
  necessite_n1: z.boolean().nullish(),
  necessite_rh: z.boolean().nullish(),
  necessite_dg: z.boolean().nullish(),
  debite_solde: z.boolean().nullish(),
  justificatif_requis: z.boolean().nullish(),
});

export type TypeCongeInput = z.infer<typeof typeCongeInputSchema>;
