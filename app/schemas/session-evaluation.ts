import { z } from "zod";
import { STATUTS_SESSION_EVALUATION, TYPES_ANNEE_SESSION } from "~/constants/enums";

/**
 * Session d'évaluation = cycle de notation (SessionEvaluationResource).
 * Son ouverture génère automatiquement les fiches des agents éligibles
 * (cycle 24 mois, parité d'année, semestre, N+1 identifiable — art. 62).
 */
export const sessionEvaluationSchema = z.object({
  id: z.number(),
  debut_session: z.string().nullable().optional(),
  fin_session: z.string().nullable().optional(),
  statut: z.enum(STATUTS_SESSION_EVALUATION),
  statut_label: z.string().nullable().optional(),
  // Parité d'année d'embauche ciblée ; `null` = pas de filtre de parité.
  type_annee: z.enum(TYPES_ANNEE_SESSION).nullable().optional(),
  // 1 = embauchés janvier–juin, 2 = juillet–décembre ; `null` = pas de filtre.
  semestre: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
  cloturee_at: z.string().nullable().optional(),
  // Compteurs présents seulement quand l'API les a chargés (`withCount`).
  nb_fiches_total: z.number().optional(),
  nb_fiches_finalisees: z.number().optional(),
  created_at: z.string().optional(),
});

export type SessionEvaluation = z.infer<typeof sessionEvaluationSchema>;

/** Payload d'ouverture / modification d'une session. */
export const sessionEvaluationInputSchema = z.object({
  debut_session: z.string().min(1, "Date de début requise"),
  fin_session: z.string().nullish(),
  type_annee: z.enum(TYPES_ANNEE_SESSION).nullish(),
  semestre: z.coerce.number().nullish(),
  description: z.string().max(500).nullish(),
});

export type SessionEvaluationInput = z.infer<typeof sessionEvaluationInputSchema>;

/**
 * Compteurs d'une session (`GET sessions/{id}/stats`). ⚠️ Sur une session sans
 * fiche, l'API sérialise les maps PHP vides en **tableaux** JSON : on les
 * ramène à un objet vide avant de valider.
 */
const compteursSchema = z.preprocess(
  (v) => (Array.isArray(v) ? {} : v),
  z.record(z.string(), z.number()),
);

export const statsSessionSchema = z.object({
  session_id: z.number(),
  total: z.number(),
  par_statut: compteursSchema,
  moyenne: z.number().nullable().optional(),
  mentions: compteursSchema,
});

export type StatsSession = z.infer<typeof statsSessionSchema>;
