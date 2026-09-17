import { z } from "zod";
import { STATUTS_AGENT, GENRES } from "~/constants/enums";

/**
 * Résumé d'un agent : champs scalaires de AgentResource SANS les relations
 * (`grade`, `affectation_active`…). Utilisé partout où un agent est imbriqué
 * dans une autre ressource (affectation, contrat, dossier…) afin d'éviter une
 * récursion de types Agent ↔ Affectation ↔ Agent. La forme complète vit dans
 * `agentSchema`, qui étend ce socle d'expansions.
 */
export const agentSummarySchema = z.object({
  id: z.number(),
  matricule: z.string().nullable().optional(),
  nom: z.string(),
  prenom: z.string(),
  nom_complet: z.string().optional(),
  date_naissance: z.string().optional(),
  lieu_naissance: z.string().nullable().optional(),
  nationalite: z.string().nullable().optional(),
  genre: z.enum(GENRES).optional(),
  telephone: z.string().nullable().optional(),
  email_personnel: z.string().nullable().optional(),
  email_professionnel: z.string().nullable().optional(),
  badge_numero: z.string().nullable().optional(),
  photo_path: z.string().nullable().optional(),
  numero_cnss: z.string().nullable().optional(),
  rib_bancaire: z.string().nullable().optional(),
  statut: z.enum(STATUTS_AGENT).optional(),
  /**
   * Fonction hors grille (DG / DC / DD, art. 55) : pas de ligne indiciaire,
   * un salaire fonctionnel. Dérivé de la nomination active, sinon de la fonction.
   */
  hors_grille: z.boolean().optional(),
  /** Motif codifié d'archivage (art. 48) et priorité de réembauche associée. */
  motif_archivage_code: z.string().nullable().optional(),
  prioritaire_reembauche_jusquau: z.string().nullable().optional(),
  date_prise_service: z.string().nullable().optional(),
  grade_id: z.number().nullable().optional(),
  categorie_id: z.number().nullable().optional(),
  echelon_id: z.number().nullable().optional(),
  fonction_id: z.number().nullable().optional(),
  type_integration_id: z.number().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type AgentSummary = z.infer<typeof agentSummarySchema>;
