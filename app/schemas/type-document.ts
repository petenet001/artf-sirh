import { z } from "zod";

/** Type de document (référentiel). Forme renvoyée par TypeDocumentResource. */
export const typeDocumentSchema = z.object({
  id: z.number(),
  nom: z.string(),
  description: z.string().nullable().optional(),
  obligatoire: z.boolean().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type TypeDocument = z.infer<typeof typeDocumentSchema>;

/** Payload de création/édition d'un type de document. */
export const typeDocumentInputSchema = z.object({
  nom: z.string().min(1),
  description: z.string().nullish(),
  obligatoire: z.boolean().nullish(),
});

export type TypeDocumentInput = z.infer<typeof typeDocumentInputSchema>;
