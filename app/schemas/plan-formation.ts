import { z } from "zod";
import { catalogueFormationSchema } from "~/schemas/catalogue-formation";
import { STATUTS_PLAN_FORMATION } from "~/constants/enums";

const utilisateurResumeSchema = z.object({ id: z.number().nullable(), name: z.string().nullable() });

/** Ligne du plan : une formation et le nombre de places prévues. */
export const planFormationLigneSchema = z.object({
  id: z.number(),
  plan_id: z.number().optional(),
  formation_id: z.number().optional(),
  formation: catalogueFormationSchema.nullable().optional(),
  places_prevues: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type PlanFormationLigne = z.infer<typeof planFormationLigneSchema>;

/**
 * Plan annuel de formation. Une année = un plan. Cycle
 * `brouillon` → `valide` → `execute` → `cloture` : le contenu (titre, lignes)
 * n'est modifiable **qu'en brouillon**, et la validation est refusée (422)
 * tant qu'aucune ligne n'est saisie.
 */
export const planFormationSchema = z.object({
  id: z.number(),
  annee: z.number(),
  titre: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  statut: z.enum(STATUTS_PLAN_FORMATION).nullable().optional(),
  statut_label: z.string().nullable().optional(),
  lignes: z.array(planFormationLigneSchema).optional(),
  createur: utilisateurResumeSchema.nullable().optional(),
  validateur: utilisateurResumeSchema.nullable().optional(),
  valide_at: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type PlanFormation = z.infer<typeof planFormationSchema>;

export const planFormationInputSchema = z.object({
  annee: z.coerce.number().min(2020).max(2100),
  titre: z.string().max(255).nullish(),
  description: z.string().nullish(),
});

export type PlanFormationInput = z.infer<typeof planFormationInputSchema>;

export const planFormationLigneInputSchema = z.object({
  formation_id: z.number(),
  places_prevues: z.coerce.number().min(1).max(500).nullish(),
  notes: z.string().nullish(),
});

export type PlanFormationLigneInput = z.infer<typeof planFormationLigneInputSchema>;
