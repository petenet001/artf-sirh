import { z } from "zod";
import { agentSocialSchema } from "~/schemas/affiliation-sociale";
import { catalogueFormationSchema } from "~/schemas/catalogue-formation";
import { diplomeSchema } from "~/schemas/diplome";

/**
 * Certification obtenue à l'issue d'une formation. Le lien `diplome_id` est le
 * même référentiel que celui du reclassement après formation (art. 73) : c'est
 * lui qui fait le pont entre formation et carrière.
 */
export const certificationFormationSchema = z.object({
  id: z.number(),
  agent_id: z.number().optional(),
  agent: agentSocialSchema.nullable().optional(),
  formation_id: z.number().optional(),
  formation: catalogueFormationSchema.nullable().optional(),
  inscription_id: z.number().nullable().optional(),
  diplome_id: z.number().nullable().optional(),
  diplome: diplomeSchema.nullable().optional(),
  date_obtention: z.string().nullable().optional(),
  reference: z.string().nullable().optional(),
  nom_original: z.string().nullable().optional(),
  mime_type: z.string().nullable().optional(),
  taille: z.number().nullable().optional(),
  has_fichier: z.boolean().optional(),
  created_at: z.string().optional(),
});

export type CertificationFormation = z.infer<typeof certificationFormationSchema>;

/** Le fichier (facultatif) est envoyé en multipart par le repository. */
export const certificationFormationInputSchema = z.object({
  agent_id: z.number(),
  formation_id: z.number(),
  inscription_id: z.number().nullish(),
  diplome_id: z.number().nullish(),
  date_obtention: z.string().min(1, "Date d'obtention requise"),
  reference: z.string().max(100).nullish(),
});

export type CertificationFormationInput = z.infer<typeof certificationFormationInputSchema>;
