import { z } from "zod";
import { NATURES_ARRET_SANTE } from "~/constants/enums";
import {
  circuitDossierSocialShape,
  pieceDossierSocialSchema,
  structureImbriqueeSchema,
} from "~/schemas/dossier-social";

/**
 * Arrêt de santé (D.3.5, art. 132–135) : maladie, accident du travail, maladie
 * professionnelle, accident non professionnel.
 *
 * L'indemnisation CCN se lit en **mois**, pas en montant unique :
 * `nb_mois` de plein traitement, puis `nb_mois_majoration` à demi-traitement —
 * d'où les deux montants `montant_mensuel` et `montant_mensuel_demi`. La durée
 * dépend de l'ancienneté et de la nature de l'arrêt ; le calcul appartient au
 * serveur, le front l'affiche.
 *
 * `demande_conge_id` relie l'arrêt au congé de maladie correspondant quand il
 * en existe un : le dossier santé et le congé décrivent la même absence vue de
 * deux services.
 */
export const arretSanteSchema = z.object({
  ...circuitDossierSocialShape,
  nature: z.enum(NATURES_ARRET_SANTE).nullable().optional(),
  nature_label: z.string().nullable().optional(),
  /** Date du fait générateur (accident, constat de la maladie). */
  date_fait: z.string().nullable().optional(),
  /** Date à laquelle l'employeur a été prévenu. */
  date_notification: z.string().nullable().optional(),
  date_debut: z.string().nullable().optional(),
  date_fin: z.string().nullable().optional(),
  structure_sanitaire_id: z.number().nullable().optional(),
  structure: structureImbriqueeSchema.nullable().optional(),
  demande_conge_id: z.number().nullable().optional(),
  nb_mois: z.number().nullable().optional(),
  nb_mois_majoration: z.number().nullable().optional(),
  montant_mensuel: z.number().nullable().optional(),
  montant_mensuel_demi: z.number().nullable().optional(),
  pieces: z.array(pieceDossierSocialSchema).optional(),
});

export type ArretSante = z.infer<typeof arretSanteSchema>;

/** Création d'un arrêt (ArretSante\CreateRequest). */
export const arretSanteInputSchema = z.object({
  agent_id: z.number(),
  nature: z.enum(NATURES_ARRET_SANTE),
  date_fait: z.string().min(1),
  date_notification: z.string().nullish(),
  date_debut: z.string().min(1),
  date_fin: z.string().nullish(),
  structure_sanitaire_id: z.number(),
  demande_conge_id: z.number().nullish(),
});

export type ArretSanteInput = z.infer<typeof arretSanteInputSchema>;
