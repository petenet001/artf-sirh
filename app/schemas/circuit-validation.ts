import { z } from "zod";
import { NIVEAUX_VALIDATION } from "~/constants/enums";

/**
 * Étape du circuit de validation configurable par type d'intégration
 * (CircuitValidationResource). Distinct de `validation-workflow`, qui est
 * l'instance de validation d'un dossier ; ici c'est la CONFIGURATION du circuit.
 */
export const circuitValidationSchema = z.object({
  id: z.number(),
  type_integration_id: z.number(),
  niveau: z.enum(NIVEAUX_VALIDATION),
  niveau_label: z.string().nullable().optional(),
  ordre: z.number(),
  actif: z.boolean(),
});

export type CircuitValidation = z.infer<typeof circuitValidationSchema>;

/** Ajout d'un niveau au circuit (CircuitValidationController::store). */
export const circuitAjouterNiveauSchema = z.object({
  niveau: z.enum(NIVEAUX_VALIDATION),
  ordre: z.number().nullish(),
});

export type CircuitAjouterNiveau = z.infer<typeof circuitAjouterNiveauSchema>;

/** Remplacement complet du circuit (CircuitValidationController::remplacer). */
export const circuitRemplacerSchema = z.object({
  niveaux: z.array(z.enum(NIVEAUX_VALIDATION)),
});

export type CircuitRemplacer = z.infer<typeof circuitRemplacerSchema>;
