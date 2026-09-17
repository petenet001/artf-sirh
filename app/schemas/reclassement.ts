import { z } from "zod";
import { agentSummarySchema } from "~/schemas/agent-summary";
import {
  TYPES_RECLASSEMENT,
  STATUTS_RECLASSEMENT,
  MOTIFS_RECONVERSION,
  ETAPES_RECLASSEMENT,
} from "~/constants/enums";

/** Classe de grille résumée dans une ressource de reclassement. */
export const classeReclassementSchema = z.object({
  id: z.number(),
  categorie: z.string().nullable().optional(),
  grade: z.string().nullable().optional(),
  coefficient: z.coerce.number().nullable().optional(),
});

/** Verdict d'éligibilité, calculé serveur et renvoyé sur le `show` seulement. */
export const eligibiliteReclassementSchema = z.object({
  ok: z.boolean(),
  messages: z.array(z.string()).optional(),
});

/**
 * Dossier de reclassement (CCN art. 73–75, ReclassementResource). Quatre
 * parcours derrière un seul objet — le `type` pilote les champs attendus :
 * - `reclassement_formation` (73) : un `diplome_id` du dossier de l'agent ;
 * - `reclassement_exceptionnel` (74a) : une `classe_cible_id` ;
 * - `hors_classe` (74b) : rien, la cible est la hors-classe ;
 * - `reconversion` (75) : `motif_reconversion` + `fonction_cible_id`.
 */
export const reclassementSchema = z.object({
  id: z.number(),
  agent_id: z.number(),
  agent: agentSummarySchema.nullable().optional(),
  type: z.enum(TYPES_RECLASSEMENT),
  type_label: z.string().nullable().optional(),
  // Article de la CCN ("73", "74", "75") — fourni par l'API.
  article: z.string().nullable().optional(),
  statut: z.enum(STATUTS_RECLASSEMENT),
  statut_label: z.string().nullable().optional(),
  prochaine_etape: z.enum(ETAPES_RECLASSEMENT).nullable().optional(),
  classe_origine: classeReclassementSchema.nullable().optional(),
  classe_cible: classeReclassementSchema.nullable().optional(),
  fonction_cible: z.object({ id: z.number(), nom: z.string().nullable() }).nullable().optional(),
  diplome_id: z.number().nullable().optional(),
  diplome: z
    .object({ id: z.number(), nom: z.string().nullable(), sigle: z.string().nullable() })
    .nullable()
    .optional(),
  motif: z.string().nullable().optional(),
  motif_reconversion: z.enum(MOTIFS_RECONVERSION).nullable().optional(),
  piece_path: z.string().nullable().optional(),
  // Éléments de contexte calculés serveur (jamais envoyés par le front).
  age_ans: z.coerce.number().nullable().optional(),
  anciennete_ans: z.coerce.number().nullable().optional(),
  annees_dans_classe: z.coerce.number().nullable().optional(),
  echelon_origine: z.coerce.number().nullable().optional(),
  echelon_cible: z.coerce.number().nullable().optional(),
  eligibilite: eligibiliteReclassementSchema.nullable().optional(),
  valide_at: z.string().nullable().optional(),
  applique_at: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

export type Reclassement = z.infer<typeof reclassementSchema>;

/**
 * Création d'un dossier. Les champs conditionnels sont tous facultatifs côté
 * schéma : c'est le backend qui tranche selon le `type` et renvoie un 422 ciblé
 * (`errors.diplome_id`, `errors.classe_cible_id`, `errors.age`…), que l'on
 * affiche tel quel. `piece_path` est un **texte** (référence), pas un upload.
 */
export const reclassementInputSchema = z.object({
  agent_id: z.number(),
  type: z.enum(TYPES_RECLASSEMENT),
  motif: z.string().min(10, "Motif requis (10 caractères min.)").max(2000),
  diplome_id: z.number().nullish(),
  classe_cible_id: z.number().nullish(),
  fonction_cible_id: z.number().nullish(),
  motif_reconversion: z.enum(MOTIFS_RECONVERSION).nullish(),
  piece_path: z.string().max(500).nullish(),
});

export type ReclassementInput = z.infer<typeof reclassementInputSchema>;

/** Approbation ou rejet (commentaire facultatif dans les deux cas). */
export const traitementReclassementSchema = z.object({
  commentaire: z.string().max(2000).nullish(),
});

export type TraitementReclassementInput = z.infer<typeof traitementReclassementSchema>;
