import { z } from "zod";
import { agentSummarySchema } from "~/schemas/agent-summary";
import { userSchema } from "~/schemas/auth";
import { typeIntegrationSchema } from "~/schemas/type-integration";
import { documentDossierSchema } from "~/schemas/document-dossier";
import { validationWorkflowSchema } from "~/schemas/validation-workflow";
import { acteAdministratifSchema } from "~/schemas/acte-administratif";
import { historiqueIntegrationSchema } from "~/schemas/historique-integration";
import { STATUTS_DOSSIER, STRUCTURABLE_TYPES } from "~/constants/enums";

/** Dossier d'intégration. Forme renvoyée par DossierIntegrationResource. */
export const dossierIntegrationSchema = z.object({
  id: z.number(),
  reference: z.string().nullable().optional(),
  statut: z.enum(STATUTS_DOSSIER).nullable().optional(),
  statut_label: z.string().nullable().optional(),
  date_demande: z.string().nullable().optional(),
  poste_demande: z.string().nullable().optional(),
  nombre_postes: z.number().nullable().optional(),
  motif: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  type_integration_id: z.number().nullable().optional(),
  type_integration: typeIntegrationSchema.optional(),
  demandeur_id: z.number().nullable().optional(),
  demandeur: userSchema.optional(),
  agent_id: z.number().nullable().optional(),
  agent: agentSummarySchema.optional(),
  documents: z.array(documentDossierSchema).optional(),
  validations: z.array(validationWorkflowSchema).optional(),
  actes: z.array(acteAdministratifSchema).optional(),
  historique: z.array(historiqueIntegrationSchema).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type DossierIntegration = z.infer<typeof dossierIntegrationSchema>;

/** Payload de création d'un dossier (DossierIntegration/CreateRequest). */
export const dossierIntegrationInputSchema = z.object({
  type_integration_id: z.number(),
  demandeur_id: z.number().nullish(),
  structurable_type: z.enum(STRUCTURABLE_TYPES).nullish(),
  structurable_id: z.number().nullish(),
  poste_demande: z.string().nullish(),
  nombre_postes: z.number().int().min(1).nullish(),
  date_demande: z.string().nullish(),
  motif: z.string().nullish(),
  notes: z.string().nullish(),
});

export type DossierIntegrationInput = z.infer<typeof dossierIntegrationInputSchema>;

/** Payload commun aux transitions de workflow (commentaire optionnel). */
export const dossierTransitionSchema = z.object({
  commentaire: z.string().max(1000).nullish(),
});

/** Payload d'assignation de matricule. */
export const assignerMatriculeSchema = z.object({
  matricule: z.string().min(1).max(50),
});

export type DossierTransitionInput = z.infer<typeof dossierTransitionSchema>;
export type AssignerMatriculeInput = z.infer<typeof assignerMatriculeSchema>;
