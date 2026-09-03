import { z } from "zod";
import { typeDocumentSchema } from "~/schemas/type-document";

/**
 * Document de la GED agent (hors dossier d'intégration). Forme renvoyée par
 * DocumentAgentResource. Le fichier se télécharge via un endpoint dédié (blob) ;
 * la ressource ne porte que les métadonnées. `sous_dossier` défaut `general`.
 */
export const documentAgentSchema = z.object({
  id: z.number(),
  agent_id: z.number(),
  type_document_id: z.number().nullable().optional(),
  type_document: typeDocumentSchema.optional(),
  titre: z.string().nullable().optional(),
  sous_dossier: z.string().nullable().optional(),
  nom_original: z.string().nullable().optional(),
  taille: z.number().nullable().optional(),
  mime_type: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

export type DocumentAgent = z.infer<typeof documentAgentSchema>;

/**
 * Métadonnées d'un dépôt de document (le fichier est envoyé à part en
 * multipart par le repository). `sous_dossier` optionnel (défaut serveur
 * `general`).
 */
export const documentAgentInputSchema = z.object({
  type_document_id: z.number(),
  titre: z.string().max(255).nullish(),
  sous_dossier: z.string().max(100).nullish(),
});

export type DocumentAgentInput = z.infer<typeof documentAgentInputSchema>;
