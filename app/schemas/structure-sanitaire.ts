import { z } from "zod";
import { TYPES_STRUCTURE_SANITAIRE } from "~/constants/enums";

/**
 * Prestataire de santé agréé par l'ARTF : médecin, formation sanitaire,
 * opticien, pharmacie. C'est un **référentiel** — les arrêts, prises en charge
 * et visites médicales s'y rattachent, ils ne le créent pas à la volée.
 *
 * `actif` désactive sans supprimer : un prestataire déréférencé doit rester
 * lisible sur les dossiers passés.
 */
export const structureSanitaireSchema = z.object({
  id: z.number(),
  nom: z.string(),
  type: z.enum(TYPES_STRUCTURE_SANITAIRE).nullable().optional(),
  type_label: z.string().nullable().optional(),
  ville: z.string().nullable().optional(),
  telephone: z.string().nullable().optional(),
  adresse: z.string().nullable().optional(),
  actif: z.boolean().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type StructureSanitaire = z.infer<typeof structureSanitaireSchema>;

export const structureSanitaireInputSchema = z.object({
  nom: z.string().min(1, "Le nom est obligatoire."),
  type: z.enum(TYPES_STRUCTURE_SANITAIRE),
  ville: z.string().nullish(),
  telephone: z.string().nullish(),
  adresse: z.string().nullish(),
  actif: z.boolean().nullish(),
});

export type StructureSanitaireInput = z.infer<typeof structureSanitaireInputSchema>;
