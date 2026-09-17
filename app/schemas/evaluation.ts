import { z } from "zod";
import { agentSummarySchema } from "~/schemas/agent-summary";
import { sessionEvaluationSchema } from "~/schemas/session-evaluation";
import { noteEvaluationSchema } from "~/schemas/note-evaluation";
import { reclamationSchema } from "~/schemas/reclamation";
import { avisHierarchiqueSchema } from "~/schemas/avis-hierarchique";
import {
  STATUTS_EVALUATION,
  MENTIONS_EVALUATION,
  ETAPES_EVALUATION,
  DECISIONS_COMMISSION,
} from "~/constants/enums";

/**
 * Poste retenu pour la notation (art. 62) : affectation **dominante** sur les
 * 24 mois précédant l'ouverture de la session, pas l'affectation du jour.
 */
export const affectationNotationSchema = z.object({
  id: z.number(),
  date_affectation: z.string().nullable().optional(),
  date_fin: z.string().nullable().optional(),
  structure: z
    .object({ id: z.number(), nom: z.string().nullable(), type: z.string().nullable() })
    .nullable()
    .optional(),
});

/**
 * Fiche d'évaluation (EvaluationResource). Les relations (`notes`, `session`,
 * `reclamation`, `avis_hierarchiques`) ne sont chargées que sur le `show` :
 * toutes optionnelles. Les actions ne rechargent pas systématiquement les
 * relations → **refetch le `show`** après chaque action.
 */
export const evaluationSchema = z.object({
  id: z.number(),
  session_id: z.number().nullable().optional(),
  session: sessionEvaluationSchema.nullable().optional(),
  agent_id: z.number(),
  agent: agentSummarySchema.nullable().optional(),
  // Notateur (N+1) : c'est lui — et lui seul — qui note et donne l'avis.
  superieur_id: z.number().nullable().optional(),
  superieur: agentSummarySchema.nullable().optional(),
  affectation_notation_id: z.number().nullable().optional(),
  affectation_notation: affectationNotationSchema.nullable().optional(),
  date_evaluation: z.string().nullable().optional(),
  // Contexte saisi par le N+1 (PUT …/contexte).
  jours_absence_non_justifiee: z.number().nullable().optional(),
  sanctions: z.string().nullable().optional(),
  avis_superieur: z.string().nullable().optional(),
  note_globale: z.coerce.number().nullable().optional(),
  mention: z.enum(MENTIONS_EVALUATION).nullable().optional(),
  // Commission préparatoire (art. 67–68) — lot tableau d'avancement.
  commission_note: z.coerce.number().nullable().optional(),
  note_synthese: z.string().nullable().optional(),
  // Commission d'avancement (art. 69–70).
  commission_decision: z.enum(DECISIONS_COMMISSION).nullable().optional(),
  commission_decision_label: z.string().nullable().optional(),
  nombre_echelons: z.number().nullable().optional(),
  note_avancement: z.coerce.number().nullable().optional(),
  echelon_avance: z.boolean().optional(),
  statut: z.enum(STATUTS_EVALUATION),
  statut_label: z.string().nullable().optional(),
  // Étape en attente — source de vérité du bouton à proposer.
  prochaine_etape: z.enum(ETAPES_EVALUATION).nullable().optional(),
  signe_par_evaluateur_at: z.string().nullable().optional(),
  signe_par_evalue_at: z.string().nullable().optional(),
  date_validation_rh: z.string().nullable().optional(),
  commentaire_rh: z.string().nullable().optional(),
  conforme_rh: z.boolean().nullable().optional(),
  inscrit_tableau: z.boolean().optional(),
  reclamation: reclamationSchema.nullable().optional(),
  avis_hierarchiques: z.array(avisHierarchiqueSchema).optional(),
  notes: z.array(noteEvaluationSchema).optional(),
  created_at: z.string().optional(),
});

export type Evaluation = z.infer<typeof evaluationSchema>;
export type AffectationNotation = z.infer<typeof affectationNotationSchema>;

/** Contexte de la fiche saisi par le notateur (`PUT …/contexte`). */
export const contexteEvaluationSchema = z.object({
  jours_absence_non_justifiee: z.coerce.number().min(0).max(365).nullish(),
  sanctions: z.string().max(1000).nullish(),
  avis_superieur: z.string().max(2000).nullish(),
});

export type ContexteEvaluationInput = z.infer<typeof contexteEvaluationSchema>;

/** Avis du notateur + signature (`POST …/avis-et-signer`) — avis obligatoire. */
export const avisEtSignerSchema = z.object({
  avis_superieur: z.string().min(10, "Avis requis (10 caractères min.)").max(2000),
});

export type AvisEtSignerInput = z.infer<typeof avisEtSignerSchema>;

/**
 * Validation RH (`POST …/valider-rh`). `conforme: true` finalise la fiche **et**
 * l'inscrit au tableau d'avancement ; `false` la rejette vers le notateur.
 */
export const validationRhSchema = z.object({
  conforme: z.boolean(),
  commentaire: z.string().max(1000).nullish(),
});

export type ValidationRhInput = z.infer<typeof validationRhSchema>;

/** Réattribution du notateur (`PUT …/superieur`) — session ouverte, fiche non terminée. */
export const reattributionSuperieurSchema = z.object({
  superieur_id: z.number(),
});

export type ReattributionSuperieurInput = z.infer<typeof reattributionSuperieurSchema>;
