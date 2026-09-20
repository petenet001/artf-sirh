import { z } from "zod";
import { structureRefSchema } from "~/schemas/structure-ref";

/** Bureau (structure organisationnelle). Forme renvoyée par BureauResource. */
export const bureauSchema = z.object({
  id: z.number(),
  nom: z.string(),
  sigle: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  service_id: z.number().nullable().optional(),
  /**
   * Sur le `show`, l'API charge `service.direction.administration` : un seul
   * appel donne donc toute la chaîne d'un bureau. On descend d'un niveau de
   * plus que `structureRefSchema` pour l'exposer — sans aller jusqu'à la
   * récursion que ce schéma sert justement à éviter.
   */
  service: structureRefSchema
    .extend({ direction: structureRefSchema.optional() })
    .optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Bureau = z.infer<typeof bureauSchema>;

/** Payload de création/édition d'un bureau. */
export const bureauInputSchema = z.object({
  nom: z.string().min(1),
  sigle: z.string().nullish(),
  description: z.string().nullish(),
  service_id: z.number().int(),
});

export type BureauInput = z.infer<typeof bureauInputSchema>;
