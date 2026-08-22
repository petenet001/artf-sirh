import { z } from "zod";
import { userSchema } from "~/schemas/auth";
import { typeDocumentSchema } from "~/schemas/type-document";

/** Document rattaché à un dossier. Forme renvoyée par DocumentDossierResource. */
export const documentDossierSchema = z.object({
  id: z.number(),
  dossier_integration_id: z.number().nullable().optional(),
  type_document_id: z.number().nullable().optional(),
  type_document: typeDocumentSchema.optional(),
  nom_original: z.string().nullable().optional(),
  chemin_fichier: z.string().nullable().optional(),
  est_obligatoire: z.boolean().nullable().optional(),
  est_valide: z.boolean().nullable().optional(),
  date_validation: z.string().nullable().optional(),
  commentaire: z.string().nullable().optional(),
  validateur: userSchema.optional(),
  created_at: z.string().optional(),
});

export type DocumentDossier = z.infer<typeof documentDossierSchema>;
