import { z } from "zod";

/**
 * Palier d'ancienneté (CCN ARTF art. 77) : jours ajoutés au solde annuel selon
 * les années de service révolues au 1er janvier. `anciennete_max: null` = pas
 * de plafond (dernier palier). Forme renvoyée par PalierAncienneteCongeResource.
 */
export const palierAncienneteSchema = z.object({
  id: z.number(),
  anciennete_min: z.number(),
  anciennete_max: z.number().nullable().optional(),
  jours_bonus: z.number(),
  created_at: z.string().optional(),
});

export type PalierAnciennete = z.infer<typeof palierAncienneteSchema>;

/**
 * Payload de création/édition. Un chevauchement avec un autre palier est
 * refusé par l'API (422, `message`) : pas de contrôle croisé ici.
 */
export const palierAncienneteInputSchema = z
  .object({
    anciennete_min: z.number().int().min(0),
    anciennete_max: z.number().int().min(0).nullish(),
    jours_bonus: z.number().int().min(0),
  })
  .refine((p) => p.anciennete_max == null || p.anciennete_max >= p.anciennete_min, {
    message: "Doit être supérieure ou égale au minimum",
    path: ["anciennete_max"],
  });

export type PalierAncienneteInput = z.infer<typeof palierAncienneteInputSchema>;
