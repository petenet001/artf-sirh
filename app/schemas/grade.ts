import { z } from "zod";

/** Grade (référentiel RH). Forme renvoyée par GradeResource. */
export const gradeSchema = z.object({
  id: z.number(),
  nom: z.string(),
  sigle: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  niveau: z.number().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Grade = z.infer<typeof gradeSchema>;

/** Payload de création/édition d'un grade. */
export const gradeInputSchema = z.object({
  nom: z.string().min(1),
  sigle: z.string().nullish(),
  description: z.string().nullish(),
  niveau: z.number().int().min(1).max(20).nullish(),
});

export type GradeInput = z.infer<typeof gradeInputSchema>;
