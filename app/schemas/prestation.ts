import { z } from "zod";
import { TYPES_PRESTATION, TYPES_PIECE_PRESTATION } from "~/constants/enums";
import {
  circuitDossierSocialShape,
  intervenantSchema,
  pieceDossierSocialSchema,
} from "~/schemas/dossier-social";

/**
 * Prestation sociale CCN ponctuelle (D.3.4, art. 119–121) : capital décès,
 * prime enfants, frais funéraires, allocation décès retraité, indemnité de
 * retraite.
 *
 * À ne pas confondre avec les allocations **calendaires** (allocations
 * familiales, arbre de Noël, rentrée scolaire, art. 58–59), qui sont versées
 * automatiquement par la paie sans passer par une demande.
 *
 * Trois montants cohabitent, et ils ne disent pas la même chose :
 * - `montant_demande` : ce que le demandeur avance (frais funéraires) ;
 * - `montant_calcule` : ce que le barème CCN donne (simulation) ;
 * - `montant_accorde` : ce que le DG a décidé — seul montant qui part en paie.
 */
export const prestationSchema = z.object({
  ...circuitDossierSocialShape,
  type: z.enum(TYPES_PRESTATION).nullable().optional(),
  type_label: z.string().nullable().optional(),
  /** Date du fait générateur : décès, ou admission à la retraite. */
  date_fait: z.string().nullable().optional(),
  ayant_droit_id: z.number().nullable().optional(),
  ayant_droit: z
    .object({
      id: z.number(),
      nom: z.string().nullable().optional(),
      prenom: z.string().nullable().optional(),
      type: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  /** Bénéficiaire nommé à la main, quand aucun ayant droit n'est enregistré. */
  beneficiaire_libelle: z.string().nullable().optional(),
  /** Frais funéraires : le transport du corps reste sous le même plafond. */
  transport_corps: z.boolean().nullable().optional(),
  montant_demande: z.number().nullable().optional(),
  montant_calcule: z.number().nullable().optional(),
  montant_accorde: z.number().nullable().optional(),
  paie_annee: z.number().nullable().optional(),
  paie_mois: z.number().nullable().optional(),
  created_by: z.number().nullable().optional(),
  createur: intervenantSchema.nullable().optional(),
  instruite_by: z.number().nullable().optional(),
  instructeur: intervenantSchema.nullable().optional(),
  decideur_id: z.number().nullable().optional(),
  decideur: intervenantSchema.nullable().optional(),
  pieces: z.array(pieceDossierSocialSchema).optional(),
});

export type Prestation = z.infer<typeof prestationSchema>;

/**
 * Création d'une prestation (Prestation\CreateRequest).
 *
 * `montant_demande` n'a de sens que pour les frais funéraires : les autres
 * types sont calculés par le barème CCN, pas saisis. Le plafond de 2 000 000 F
 * est vérifié côté serveur — on ne le duplique pas ici, il appartient à la
 * convention et peut bouger.
 */
export const prestationInputSchema = z.object({
  agent_id: z.number(),
  type: z.enum(TYPES_PRESTATION),
  date_fait: z.string().min(1),
  ayant_droit_id: z.number().nullish(),
  beneficiaire_libelle: z.string().nullish(),
  transport_corps: z.boolean().nullish(),
  montant_demande: z.number().int().min(1).nullish(),
});

export type PrestationInput = z.infer<typeof prestationInputSchema>;

/**
 * Résultat de `GET /prestations/{id}/simulation` : le barème CCN **détaillé**.
 *
 * Le serveur ne renvoie pas qu'un montant, il renvoie le chemin qui y mène —
 * traitement de base, prime d'ancienneté, nombre de mois du barème. C'est ce
 * qui permet d'afficher un calcul vérifiable plutôt qu'un chiffre à croire sur
 * parole, et de comprendre un montant qui surprend.
 *
 * `jours_deduits` compte les périodes de détachement ou de disponibilité, qui
 * ne comptent pas dans l'ancienneté (art. 119).
 */
export const simulationPrestationSchema = z.object({
  type: z.string().nullable().optional(),
  article_ccn: z.string().nullable().optional(),
  montant: z.number().nullable().optional(),
  base: z.number().nullable().optional(),
  prime_anciennete: z.number().nullable().optional(),
  traitement_brut: z.number().nullable().optional(),
  annees_anciennete: z.number().nullable().optional(),
  jours_deduits: z.number().nullable().optional(),
  nb_mois_bareme: z.number().nullable().optional(),
  nb_enfants_a_charge: z.number().nullable().optional(),
  transport_corps: z.boolean().nullable().optional(),
  plafond_funeraires: z.number().nullable().optional(),
});

export type SimulationPrestation = z.infer<typeof simulationPrestationSchema>;

export const typePiecePrestationSchema = z.enum(TYPES_PIECE_PRESTATION);
export type TypePiecePrestation = z.infer<typeof typePiecePrestationSchema>;
