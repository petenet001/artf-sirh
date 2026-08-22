import { z } from "zod";
import { agentSchema } from "~/schemas/agent";
import { dossierIntegrationSchema } from "~/schemas/dossier-integration";
import { TYPES_STAGE, STATUTS_CONVENTION_STAGE } from "~/constants/enums";

/**
 * Convention de stage (ConventionStageResource) — entité distincte de la « vue
 * dérivée stagiaires » (qui filtre les agents). `agent_id` / `contrat_id` /
 * `tuteur_interne_id` / `dossier_integration_id` ne remontent que si la relation
 * correspondante n'est pas chargée. `jours_avant_fin` n'est présent que pour un
 * stage en cours.
 */
export const conventionStageSchema = z.object({
  id: z.number(),
  type_stage: z.enum(TYPES_STAGE).nullable().optional(),
  type_stage_label: z.string().nullable().optional(),
  etablissement: z.string().nullable().optional(),
  date_debut: z.string().nullable().optional(),
  date_fin: z.string().nullable().optional(),
  statut_stage: z.enum(STATUTS_CONVENTION_STAGE).nullable().optional(),
  statut_stage_label: z.string().nullable().optional(),
  note_finale: z.number().nullable().optional(),
  appreciation: z.string().nullable().optional(),
  jours_avant_fin: z.number().nullable().optional(),

  agent_id: z.number().optional(),
  agent: agentSchema.optional(),
  contrat_id: z.number().nullable().optional(),
  tuteur_interne_id: z.number().nullable().optional(),
  tuteur_interne: agentSchema.optional(),
  dossier_integration_id: z.number().optional(),
  dossier: dossierIntegrationSchema.optional(),

  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type ConventionStage = z.infer<typeof conventionStageSchema>;

/** Prolongation d'un stage (Stage/ProlongerRequest) — nouvelle date de fin (futur). */
export const stageProlongerSchema = z.object({
  date_fin: z.string().min(1),
});

export type StageProlonger = z.infer<typeof stageProlongerSchema>;

/** Clôture d'un stage (Stage/CloturerRequest) — note /20 + appréciation. */
export const stageCloturerSchema = z.object({
  note: z.number().min(0).max(20),
  appreciation: z.string().min(10).max(2000),
});

export type StageCloturer = z.infer<typeof stageCloturerSchema>;
