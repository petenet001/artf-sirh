import { z } from "zod";

/** Jour férié (paramétrage RH). Forme renvoyée par JourFerieResource. */
export const jourFerieSchema = z.object({
  id: z.number(),
  nom: z.string(),
  date: z.string().nullable().optional(),
  // `recurrent: true` → la date (mois/jour) se répète chaque année dans le calcul
  // des jours ouvrables.
  recurrent: z.boolean(),
  created_at: z.string().optional(),
});

export type JourFerie = z.infer<typeof jourFerieSchema>;

/** Payload de création/édition d'un jour férié. */
export const jourFerieInputSchema = z.object({
  nom: z.string().min(1),
  date: z.string().min(1),
  recurrent: z.boolean().nullish(),
});

export type JourFerieInput = z.infer<typeof jourFerieInputSchema>;
