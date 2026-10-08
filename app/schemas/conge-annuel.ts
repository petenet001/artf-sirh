import { z } from "zod";
import { agentSummarySchema } from "~/schemas/agent-summary";
import {
  ORIGINES_CONGE_ANNUEL,
  STATUTS_CAMPAGNE_CONGE_ANNUEL,
  STATUTS_REPORT_CONGE_ANNUEL,
} from "~/constants/enums";

/**
 * Congé annuel (`/api/conges-annuels`) — note FE §2c « Congé annuel — campagne ».
 *
 * Les **demandes** gardent la forme de `/conges/demandes` (`demandeCongeSchema`,
 * enrichi de `origine`, `campagne_conge_annuel_id`, `date_reprise`). Ce fichier
 * ne porte que ce qui est propre au module : la campagne, le report et les
 * payloads d'entrée.
 */

/** Campagne de propositions (CampagneCongeAnnuelResource). Une par année. */
export const campagneCongeAnnuelSchema = z.object({
  id: z.number(),
  annee: z.number(),
  date_ouverture: z.string().nullable().optional(),
  date_cloture: z.string().nullable().optional(),
  // Horodatage réel de la clôture (≠ date prévue) — sert au droit « après clôture ».
  date_cloture_effective: z.string().nullable().optional(),
  statut: z.enum(STATUTS_CAMPAGNE_CONGE_ANNUEL),
  statut_label: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
});

export type CampagneCongeAnnuel = z.infer<typeof campagneCongeAnnuelSchema>;

/** Création d'une campagne (RH). Elle naît en `brouillon`. */
export const campagneCongeAnnuelInputSchema = z
  .object({
    annee: z.number().int().min(2000).max(2100),
    date_ouverture: z.string().min(1, "Date d'ouverture requise"),
    date_cloture: z.string().min(1, "Date de clôture requise"),
  })
  .refine((d) => d.date_cloture >= d.date_ouverture, {
    message: "La clôture ne peut précéder l'ouverture",
    path: ["date_cloture"],
  });

export type CampagneCongeAnnuelInput = z.infer<typeof campagneCongeAnnuelInputSchema>;

/**
 * Proposition de congé annuel. **Date de départ seule** : le serveur pose tout
 * le solde de l'année et calcule `date_fin`, `date_reprise` et `nb_jours`.
 * `origine` omise = `campagne`.
 */
export const congeAnnuelInputSchema = z.object({
  agent_id: z.number(),
  date_debut: z.string().min(1, "Date de départ requise"),
  motif: z.string().nullish(),
  origine: z.enum(ORIGINES_CONGE_ANNUEL).nullish(),
});

export type CongeAnnuelInput = z.infer<typeof congeAnnuelInputSchema>;

/** Report pour nécessité de service (ReportCongeAnnuelResource). */
export const reportCongeAnnuelSchema = z.object({
  id: z.number(),
  agent_id: z.number(),
  agent: agentSummarySchema.nullable().optional(),
  annee_source: z.number(),
  annee_cible: z.number(),
  // Reliquat de l'année source au moment de la proposition (≤ 60 j ouvrables).
  jours: z.number(),
  motif: z.string().nullable().optional(),
  statut: z.enum(STATUTS_REPORT_CONGE_ANNUEL),
  statut_label: z.string().nullable().optional(),
  commentaire_decision: z.string().nullable().optional(),
  date_decision: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
});

export type ReportCongeAnnuel = z.infer<typeof reportCongeAnnuelSchema>;

/** Proposition de report par le N+1. Le report ne fixe aucune date. */
export const reportCongeAnnuelInputSchema = z.object({
  agent_id: z.number(),
  annee_source: z.number().int().min(2000).max(2100),
  motif: z.string().min(3, "Motif requis (3 caractères min.)"),
});

export type ReportCongeAnnuelInput = z.infer<typeof reportCongeAnnuelInputSchema>;

/** Refus RH d'un report : commentaire obligatoire. */
export const refusReportSchema = z.object({
  commentaire: z.string().min(3, "Motif requis (3 caractères min.)"),
});

export type RefusReportInput = z.infer<typeof refusReportSchema>;
