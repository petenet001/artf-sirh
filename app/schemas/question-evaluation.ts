import { z } from "zod";
import { TYPES_CRITERE_EVALUATION } from "~/constants/enums";

/**
 * Critère de la grille d'évaluation (QuestionEvaluationResource). La grille
 * seedée compte 24 critères : 12 compétence pro (/10), 3 assiduité (/3),
 * 9 relations sociales (/7) — soit 20 points au total (CCN art. 63).
 */
export const questionEvaluationSchema = z.object({
  id: z.number(),
  libelle: z.string(),
  type_critere: z.enum(TYPES_CRITERE_EVALUATION),
  // Barème du critère pris isolément (0,5 à 20). Plafond de la note saisie.
  bareme_max: z.coerce.number(),
  ordre: z.number().nullable().optional(),
  actif: z.boolean().optional(),
  created_at: z.string().optional(),
});

export type QuestionEvaluation = z.infer<typeof questionEvaluationSchema>;

/**
 * Payload CRUD d'un critère. ⚠️ Supprimer un critère efface les notes déjà
 * saisies : préférer `actif: false` (l'API accepte les deux).
 */
export const questionEvaluationInputSchema = z.object({
  libelle: z.string().min(1, "Libellé requis").max(255),
  type_critere: z.enum(TYPES_CRITERE_EVALUATION),
  bareme_max: z.coerce.number().min(0.5, "Barème min. 0,5").max(20, "Barème max. 20"),
  ordre: z.coerce.number().min(0).nullish(),
  actif: z.boolean().nullish(),
});

export type QuestionEvaluationInput = z.infer<typeof questionEvaluationInputSchema>;
