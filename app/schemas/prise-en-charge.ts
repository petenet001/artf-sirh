import { z } from "zod";
import { TYPES_PRISE_EN_CHARGE } from "~/constants/enums";
import {
  circuitDossierSocialShape,
  pieceDossierSocialSchema,
  structureImbriqueeSchema,
} from "~/schemas/dossier-social";

/**
 * Prise en charge de frais médicaux (D.3.5, art. 122–127) : honoraires et
 * soins, pharmacie, verres correcteurs, hospitalisation, évacuation sanitaire.
 *
 * `ayant_droit_id` sert quand les soins concernent un membre de la famille à
 * charge et non l'agent lui-même. `at_mp` marque les soins consécutifs à un
 * accident du travail ou à une maladie professionnelle : la CCN les prend en
 * charge à un autre taux, d'où le drapeau plutôt qu'un type de plus.
 *
 * `date_debut` / `date_fin` ne concernent que les séjours (hospitalisation,
 * évacuation) ; pour des soins ponctuels, seule `date_soins` est renseignée.
 */
export const priseEnChargeSchema = z.object({
  ...circuitDossierSocialShape,
  type: z.enum(TYPES_PRISE_EN_CHARGE).nullable().optional(),
  type_label: z.string().nullable().optional(),
  date_soins: z.string().nullable().optional(),
  ayant_droit_id: z.number().nullable().optional(),
  structure_sanitaire_id: z.number().nullable().optional(),
  structure: structureImbriqueeSchema.nullable().optional(),
  montant_facture: z.number().nullable().optional(),
  montant_calcule: z.number().nullable().optional(),
  montant_accorde: z.number().nullable().optional(),
  date_debut: z.string().nullable().optional(),
  date_fin: z.string().nullable().optional(),
  lieu: z.string().nullable().optional(),
  at_mp: z.boolean().nullable().optional(),
  paie_annee: z.number().nullable().optional(),
  paie_mois: z.number().nullable().optional(),
  pieces: z.array(pieceDossierSocialSchema).optional(),
});

export type PriseEnCharge = z.infer<typeof priseEnChargeSchema>;

/** Création d'une prise en charge (PriseEnCharge\CreateRequest). */
export const priseEnChargeInputSchema = z.object({
  agent_id: z.number(),
  type: z.enum(TYPES_PRISE_EN_CHARGE),
  date_soins: z.string().min(1),
  structure_sanitaire_id: z.number(),
  ayant_droit_id: z.number().nullish(),
  montant_facture: z.number().int().min(1).nullish(),
  date_debut: z.string().nullish(),
  date_fin: z.string().nullish(),
  lieu: z.string().nullish(),
  at_mp: z.boolean().nullish(),
});

export type PriseEnChargeInput = z.infer<typeof priseEnChargeInputSchema>;
