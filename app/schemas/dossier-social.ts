import { z } from "zod";
import { STATUTS_DOSSIER_SOCIAL, ETAPES_DOSSIER_SOCIAL } from "~/constants/enums";

/**
 * Socle commun aux trois dossiers sociaux instruits : **prestation** (D.3.4),
 * **prise en charge** et **arrêt de santé** (D.3.5).
 *
 * Le backend en a fait trois modules séparés, mais leur circuit est le même au
 * champ près :
 *
 * ```
 * brouillon → soumise → instruite → accordee | refusee
 *                                 ↘ classee
 * ```
 *
 * Même workflow, mêmes pièces, même PDF de décision, mêmes permissions
 * (`gerer-affaires-sociales` pour instruire, `decider-prestations` pour
 * décider). On décrit donc le tronc ici, une fois, et chaque schéma métier
 * l'étend avec ses propres champs. Ça évite trois copies qui divergeraient au
 * premier changement de statut.
 */

/** Une personne citée dans un dossier (créateur, instructeur, décideur). */
export const intervenantSchema = z.object({
  id: z.number(),
  name: z.string(),
});

/** Identité minimale d'un agent, telle que renvoyée par `AgentIdentiteResource`. */
export const agentIdentiteSchema = z.object({
  id: z.number(),
  matricule: z.string().nullable().optional(),
  nom: z.string().nullable().optional(),
  prenom: z.string().nullable().optional(),
  nom_complet: z.string().nullable().optional(),
});

/** Structure sanitaire telle qu'imbriquée dans un dossier (forme réduite). */
export const structureImbriqueeSchema = z.object({
  id: z.number(),
  nom: z.string(),
  type: z.string().nullable().optional(),
});

/**
 * Champs du circuit, présents à l'identique sur les trois dossiers.
 *
 * `prochaine_etape` est la **source de vérité** du bouton à afficher : le statut
 * seul ne suffit pas (un dossier `instruite` attend « accorder », mais c'est le
 * serveur qui le dit, pas nous).
 */
export const circuitDossierSocialShape = {
  id: z.number(),
  agent_id: z.number(),
  agent: agentIdentiteSchema.nullable().optional(),
  statut: z.enum(STATUTS_DOSSIER_SOCIAL).nullable().optional(),
  statut_label: z.string().nullable().optional(),
  prochaine_etape: z.enum(ETAPES_DOSSIER_SOCIAL).nullable().optional(),
  article_ccn: z.string().nullable().optional(),
  /** Instruction et décision : renseignés au fil du circuit. */
  notes_instruction: z.string().nullable().optional(),
  commentaire_decision: z.string().nullable().optional(),
  date_decision: z.string().nullable().optional(),
  /** Trace du calcul CCN au moment de la décision — figée, jamais recalculée. */
  calcul_snapshot: z.unknown().nullable().optional(),
  /** Pose en paie : renseignée à l'accord. */
  paie_element_affectation_id: z.number().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
};

/** Pièce justificative jointe à un dossier social. */
export const pieceDossierSocialSchema = z.object({
  id: z.number(),
  type_piece: z.string().nullable().optional(),
  type_piece_label: z.string().nullable().optional(),
  nom_original: z.string().nullable().optional(),
  mime_type: z.string().nullable().optional(),
  taille: z.number().nullable().optional(),
  uploaded_by: z.number().nullable().optional(),
  uploader: intervenantSchema.nullable().optional(),
  created_at: z.string().optional(),
});

export type PieceDossierSocial = z.infer<typeof pieceDossierSocialSchema>;
export type AgentIdentite = z.infer<typeof agentIdentiteSchema>;
export type StructureImbriquee = z.infer<typeof structureImbriqueeSchema>;

/** Corps des transitions qui n'exigent qu'un texte. */
export const instruireInputSchema = z.object({
  notes_instruction: z.string().min(3, "Trois caractères au minimum."),
});
export const refuserInputSchema = z.object({
  commentaire: z.string().min(3, "Le motif du refus est obligatoire."),
});
export const classerInputSchema = z.object({
  commentaire: z.string().nullish(),
});

/**
 * Corps de l'accord. `paie_annee` / `paie_mois` choisissent le mois de pose en
 * paie ; omis, le serveur prend le mois courant.
 */
export const accorderInputSchema = z.object({
  date_decision: z.string().nullish(),
  commentaire: z.string().nullish(),
  paie_annee: z.number().int().min(2000).max(2100).nullish(),
  paie_mois: z.number().int().min(1).max(12).nullish(),
});

export type InstruireInput = z.infer<typeof instruireInputSchema>;
export type RefuserInput = z.infer<typeof refuserInputSchema>;
export type ClasserInput = z.infer<typeof classerInputSchema>;
export type AccorderInput = z.infer<typeof accorderInputSchema>;
