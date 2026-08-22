import { z } from "zod";
import { userSchema } from "~/schemas/auth";
import { TYPES_ACTE_ADMINISTRATIF } from "~/constants/enums";

/** Acte administratif. Forme renvoyée par ActeAdministratifResource. */
export const acteAdministratifSchema = z.object({
  id: z.number(),
  dossier_integration_id: z.number().nullable().optional(),
  type_acte: z.enum(TYPES_ACTE_ADMINISTRATIF).nullable().optional(),
  type_acte_label: z.string().nullable().optional(),
  numero: z.string().nullable().optional(),
  contenu: z.string().nullable().optional(),
  fichier_path: z.string().nullable().optional(),
  signe: z.boolean().nullable().optional(),
  date_signature: z.string().nullable().optional(),
  signataire: userSchema.optional(),
  created_at: z.string().optional(),
});

export type ActeAdministratif = z.infer<typeof acteAdministratifSchema>;

/** Payload de génération d'un acte (ActeAdministratif/GenererRequest). */
export const acteGenererSchema = z.object({
  type_acte: z.enum(TYPES_ACTE_ADMINISTRATIF),
  contenu: z.string().nullish(),
});

export type ActeGenererInput = z.infer<typeof acteGenererSchema>;
