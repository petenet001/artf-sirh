import { z } from "zod";
import { TYPES_VISITE_MEDICALE } from "~/constants/enums";
import { agentIdentiteSchema, structureImbriqueeSchema } from "~/schemas/dossier-social";

/**
 * Visite médicale (D.3.5) : embauche, annuelle, consultation.
 *
 * Contrairement aux trois autres dossiers santé, une visite **n'a pas de
 * circuit** : elle est constatée, pas instruite ni décidée. D'où l'absence de
 * statut, de pièces et de décision — ne pas chercher à l'aligner sur les
 * autres, c'est une nature différente.
 *
 * L'enjeu de conformité est la visite **annuelle** : son absence est remontée
 * par `alertesAnnuelles()`.
 */
export const visiteMedicaleSchema = z.object({
  id: z.number(),
  agent_id: z.number(),
  agent: agentIdentiteSchema.nullable().optional(),
  type: z.enum(TYPES_VISITE_MEDICALE).nullable().optional(),
  type_label: z.string().nullable().optional(),
  date_visite: z.string().nullable().optional(),
  structure_sanitaire_id: z.number().nullable().optional(),
  structure: structureImbriqueeSchema.nullable().optional(),
  observations: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

export type VisiteMedicale = z.infer<typeof visiteMedicaleSchema>;

export const visiteMedicaleInputSchema = z.object({
  agent_id: z.number(),
  type: z.enum(TYPES_VISITE_MEDICALE),
  date_visite: z.string().min(1),
  structure_sanitaire_id: z.number(),
  observations: z.string().nullish(),
});

export type VisiteMedicaleInput = z.infer<typeof visiteMedicaleInputSchema>;
