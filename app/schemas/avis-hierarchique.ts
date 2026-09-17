import { z } from "zod";
import { NIVEAUX_AVIS_HIERARCHIQUE } from "~/constants/enums";

/**
 * Avis d'un niveau de la chaîne hiérarchique sur une fiche (CCN art. 64,
 * AvisHierarchiqueResource). Chaîne : chef de bureau → chef de service →
 * directeur → DG, le niveau `directeur` étant sauté si la direction est
 * rattachée au DG. Un avis signé n'est plus modifiable (422).
 */
export const avisHierarchiqueSchema = z.object({
  id: z.number(),
  evaluation_id: z.number(),
  niveau: z.enum(NIVEAUX_AVIS_HIERARCHIQUE),
  niveau_label: z.string().nullable().optional(),
  ordre: z.number().nullable().optional(),
  avis: z.string().nullable().optional(),
  // `true` = favorable, `false` = défavorable, `null` = non prononcé.
  approuve: z.boolean().nullable().optional(),
  observations: z.string().nullable().optional(),
  signe: z.boolean().optional(),
  date_signature: z.string().nullable().optional(),
  signe_par: z.object({ id: z.number().nullable(), name: z.string().nullable() }).nullable().optional(),
  created_at: z.string().optional(),
});

export type AvisHierarchique = z.infer<typeof avisHierarchiqueSchema>;

/** Dépôt / modification d'un avis hiérarchique. */
export const avisHierarchiqueInputSchema = z.object({
  niveau: z.enum(NIVEAUX_AVIS_HIERARCHIQUE),
  avis: z.string().max(2000).nullish(),
  approuve: z.boolean().nullish(),
  observations: z.string().max(1000).nullish(),
});

export type AvisHierarchiqueInput = z.infer<typeof avisHierarchiqueInputSchema>;

/**
 * Maillon de la chaîne d'avis attendue pour une fiche
 * (`GET evaluations/{id}/niveaux-requis`). La chaîne est calculée serveur
 * depuis l'affectation active de l'agent : elle saute le niveau `directeur`
 * quand la direction est rattachée au DG, et revient **vide** si l'agent n'a
 * pas d'affectation exploitable.
 */
export const niveauRequisSchema = z.object({
  niveau: z.enum(NIVEAUX_AVIS_HIERARCHIQUE),
  label: z.string(),
});

export type NiveauRequis = z.infer<typeof niveauRequisSchema>;
