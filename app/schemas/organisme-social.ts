import { z } from "zod";
import { TYPES_ORGANISME_SOCIAL } from "~/constants/enums";

/**
 * Organisme social (CNSS, mutuelle, complémentaire…). L'organisme `systeme`
 * — la CNSS, seedée avec le code `CNSS` — n'est ni supprimable ni modifiable
 * dans son type et son code (422).
 */
export const organismeSocialSchema = z.object({
  id: z.number(),
  nom: z.string(),
  code: z.string().nullable().optional(),
  type: z.enum(TYPES_ORGANISME_SOCIAL).nullable().optional(),
  type_label: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  telephone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  adresse: z.string().nullable().optional(),
  actif: z.boolean().optional(),
  systeme: z.boolean().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type OrganismeSocial = z.infer<typeof organismeSocialSchema>;

export const organismeSocialInputSchema = z.object({
  nom: z.string().min(1, "Nom requis").max(255),
  code: z.string().max(50).nullish(),
  type: z.enum(TYPES_ORGANISME_SOCIAL),
  description: z.string().nullish(),
  telephone: z.string().max(50).nullish(),
  email: z.string().email("Adresse e-mail invalide").max(255).nullish(),
  adresse: z.string().max(255).nullish(),
  actif: z.boolean().nullish(),
});

export type OrganismeSocialInput = z.infer<typeof organismeSocialInputSchema>;
