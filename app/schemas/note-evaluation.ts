import { z } from "zod";
import { questionEvaluationSchema } from "~/schemas/question-evaluation";

/**
 * Note d'un critère sur une fiche (NoteEvaluationResource). Une note = un appel
 * `POST evaluations/{id}/noter` : le backend recalcule la note globale et la
 * mention, et renvoie la fiche entière.
 */
export const noteEvaluationSchema = z.object({
  id: z.number().optional(),
  evaluation_id: z.number().optional(),
  question_id: z.number(),
  question: questionEvaluationSchema.optional(),
  note_obtenue: z.coerce.number(),
  commentaire: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

export type NoteEvaluation = z.infer<typeof noteEvaluationSchema>;

/**
 * Payload de notation d'**un seul** critère. Le plafond réel est le
 * `bareme_max` du critère : contrôlé à la saisie (le backend renvoie 422).
 */
export const noteEvaluationInputSchema = z.object({
  question_id: z.number(),
  note_obtenue: z.coerce.number().min(0, "Note positive requise"),
  commentaire: z.string().max(500).nullish(),
});

export type NoteEvaluationInput = z.infer<typeof noteEvaluationInputSchema>;
