import { z } from "zod";
import { STATUTS_ESSAI } from "~/constants/enums";

/**
 * Période d'essai, partagée par le contrat (CCN art. 49) et la nomination sur
 * emploi supérieur (art. 50).
 *
 * Durée fixée par la classe : 1 mois (classes 1–4), 2 mois (5–6), 3 mois
 * (7–10). `prochaine_etape` vaut `confirmer-essai` tant que l'essai est
 * ouvert ; `peut_renouveler` n'est vrai qu'une fois (contrats).
 */
export const essaiSchema = z.object({
  statut: z.enum(STATUTS_ESSAI).nullable().optional(),
  statut_label: z.string().nullable().optional(),
  duree_mois: z.number().nullable().optional(),
  date_debut: z.string().nullable().optional(),
  date_fin: z.string().nullable().optional(),
  renouvele: z.boolean().optional(),
  date_confirmation: z.string().nullable().optional(),
  prochaine_etape: z.literal("confirmer-essai").nullable().optional(),
  peut_renouveler: z.boolean().optional(),
});

export type Essai = z.infer<typeof essaiSchema>;

/** Rupture d'essai : sans préavis ni indemnité (art. 49). */
export const ruptureEssaiSchema = z.object({
  commentaire: z.string().max(2000).nullish(),
});

export type RuptureEssaiInput = z.infer<typeof ruptureEssaiSchema>;

/**
 * Alerte « délai de 30 jours » (art. 52) : agents ayant pris leur service sans
 * contrat CDI/CDD signé dans les 30 jours ouvrables.
 */
export const alerteDelaiContratSchema = z.object({
  dossier_id: z.number(),
  reference: z.string().nullable().optional(),
  agent_id: z.number().nullable().optional(),
  agent: z
    .object({
      id: z.number(),
      matricule: z.string().nullable().optional(),
      nom: z.string().nullable().optional(),
      prenom: z.string().nullable().optional(),
      nom_complet: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  type_integration: z.string().nullable().optional(),
  date_prise_service: z.string().nullable().optional(),
  jours_ouvrables: z.number().nullable().optional(),
});

export type AlerteDelaiContrat = z.infer<typeof alerteDelaiContratSchema>;
