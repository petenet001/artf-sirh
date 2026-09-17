import { z } from "zod";
import { personneSchema } from "~/schemas/personne";
import { gradeSchema } from "~/schemas/grade";
import { categorieSchema } from "~/schemas/categorie";
import { echelonSchema } from "~/schemas/echelon";
import { fonctionSchema } from "~/schemas/fonction";
import { typeIntegrationSchema } from "~/schemas/type-integration";
import { affectationSchema } from "~/schemas/affectation";
import { nominationSchema } from "~/schemas/nomination";
import { contratSchema } from "~/schemas/contrat";
import { informationsPersonnelleSchema } from "~/schemas/informations-personnelle";
import { informationsProfessionnelleSchema } from "~/schemas/informations-professionnelle";
import { situationFamilialeSchema } from "~/schemas/situation-familiale";
import { contactUrgenceSchema } from "~/schemas/contact-urgence";
import { documentAgentSchema } from "~/schemas/document-agent";
import { STATUTS_AGENT, STATUTS_AGENT_MODIFIABLES } from "~/constants/enums";

/**
 * Agent = personne titulaire d'un poste. Étend le socle `personne` avec les
 * champs propres à la carrière administrative. Forme calée sur AgentResource.
 * Les relations (`grade`, `affectation_active`…) ne sont présentes que sur le
 * détail (`show`) ; la liste (`index`) ne renvoie que les `*_id`.
 */
export const agentSchema = personneSchema.extend({
  matricule: z.string().nullable().optional(),
  nom_complet: z.string().optional(),
  email_professionnel: z.string().email().nullable().optional(),
  badge_numero: z.string().nullable().optional(),
  photo_path: z.string().nullable().optional(),
  numero_cnss: z.string().nullable().optional(),
  rib_bancaire: z.string().nullable().optional(),
  statut: z.enum(STATUTS_AGENT).default("actif"),
  date_prise_service: z.string().nullable().optional(),
  /**
   * Fonction hors grille (DG / DC / DD, art. 55) : rémunération fonctionnelle,
   * sans ligne indiciaire ni bulletin indiciaire. Dérivé de la nomination
   * active, sinon de la fonction.
   */
  hors_grille: z.boolean().optional(),
  // Archivage (vie courante) : posés à l'archivage, remis à null au désarchivage.
  archived_at: z.string().nullable().optional(),
  motif_archivage: z.string().nullable().optional(),
  /** Motif codifié de sortie et priorité de réembauche associée (art. 48). */
  motif_archivage_code: z.string().nullable().optional(),
  prioritaire_reembauche_jusquau: z.string().nullable().optional(),

  grade_id: z.number().nullable().optional(),
  grade: gradeSchema.optional(),
  categorie_id: z.number().nullable().optional(),
  categorie: categorieSchema.optional(),
  echelon_id: z.number().nullable().optional(),
  echelon: echelonSchema.optional(),
  fonction_id: z.number().nullable().optional(),
  fonction: fonctionSchema.optional(),
  type_integration_id: z.number().nullable().optional(),
  type_integration: typeIntegrationSchema.optional(),

  affectation_active: affectationSchema.optional(),
  nomination_active: nominationSchema.optional(),
  contrat_actif: contratSchema.optional(),

  // Vie courante — chargées uniquement sur la fiche personnel
  // (`GET /personnel/agents/{id}`). `null` = renseignable mais encore vide.
  informations_personnelles: informationsPersonnelleSchema.nullable().optional(),
  informations_professionnelles: informationsProfessionnelleSchema.nullable().optional(),
  situation_familiale: situationFamilialeSchema.nullable().optional(),
  contacts_urgence: z.array(contactUrgenceSchema).optional(),
  documents: z.array(documentAgentSchema).optional(),

  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Agent = z.infer<typeof agentSchema>;

/** Payload d'archivage d'un agent (Agent\ArchiverRequest) : motif requis. */
export const agentArchiverSchema = z.object({
  motif: z.string().min(3, "Motif requis (3 caractères min.)"),
});

export type AgentArchiverInput = z.infer<typeof agentArchiverSchema>;

/**
 * Payload de création d'un agent (Agent\CreateRequest). Le matricule, le
 * statut et la prise de service sont gérés par le workflow d'intégration.
 */
export const agentInputSchema = z.object({
  nom: z.string().min(1),
  prenom: z.string().min(1),
  date_naissance: z.string().min(1),
  lieu_naissance: z.string().nullish(),
  nationalite: z.string().nullish(),
  genre: personneSchema.shape.genre,
  telephone: z.string().nullish(),
  email_personnel: z.string().email().nullish(),
  numero_cnss: z.string().nullish(),
  rib_bancaire: z.string().nullish(),
  diplome_id: z.number().nullish(),
  grade_id: z.number().nullish(),
  categorie_id: z.number().nullish(),
  echelon_id: z.number().nullish(),
  fonction_id: z.number().nullish(),
  type_integration_id: z.number(),
});

export type AgentInput = z.infer<typeof agentInputSchema>;

/**
 * Payload d'édition d'un agent (Agent\UpdateRequest). À la différence de la
 * création, le backend n'accepte ni `type_integration_id` ni `diplome_id`,
 * mais accepte le `statut` — `sometimes`, et seulement parmi les statuts
 * modifiables (`stagiaire` / `archive` → 422) : on l'omet s'il ne l'est pas.
 */
export const agentUpdateSchema = z.object({
  nom: z.string().min(1),
  prenom: z.string().min(1),
  date_naissance: z.string().min(1),
  lieu_naissance: z.string().nullish(),
  nationalite: z.string().nullish(),
  genre: personneSchema.shape.genre,
  telephone: z.string().nullish(),
  email_personnel: z.string().email().nullish(),
  numero_cnss: z.string().nullish(),
  rib_bancaire: z.string().nullish(),
  grade_id: z.number().nullish(),
  categorie_id: z.number().nullish(),
  echelon_id: z.number().nullish(),
  fonction_id: z.number().nullish(),
  statut: z.enum(STATUTS_AGENT_MODIFIABLES).optional(),
});

export type AgentUpdateInput = z.infer<typeof agentUpdateSchema>;

/** Modification du seul matricule (Agent\ModifierMatriculeRequest). */
export const agentMatriculeSchema = z.object({
  matricule: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[A-Z0-9-]+$/, "Lettres majuscules, chiffres et tirets uniquement"),
});

export type AgentMatriculeInput = z.infer<typeof agentMatriculeSchema>;
