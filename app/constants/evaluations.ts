import type {
  STATUTS_COMMISSION,
  STATUTS_BONIFICATION,
  TYPES_CONNAISSANCE,
  STATUTS_EVALUATION,
  STATUTS_SESSION_EVALUATION,
  STATUTS_RECLAMATION,
  MENTIONS_EVALUATION,
  TYPES_CRITERE_EVALUATION,
  ETAPES_EVALUATION,
  NIVEAUX_AVIS_HIERARCHIQUE,
  DECISIONS_COMMISSION,
} from "~/constants/enums";
import type { BadgeColor } from "~/constants/carriere";

// Même helper d'affichage d'agent que la carrière et les congés.
export { agentNom } from "~/constants/carriere";
export type { BadgeColor } from "~/constants/carriere";

export type StatutEvaluation = (typeof STATUTS_EVALUATION)[number];
export type StatutSessionEvaluation = (typeof STATUTS_SESSION_EVALUATION)[number];
export type StatutReclamation = (typeof STATUTS_RECLAMATION)[number];
export type MentionEvaluation = (typeof MENTIONS_EVALUATION)[number];
export type TypeCritereEvaluation = (typeof TYPES_CRITERE_EVALUATION)[number];
export type EtapeEvaluation = (typeof ETAPES_EVALUATION)[number];
export type NiveauAvisHierarchique = (typeof NIVEAUX_AVIS_HIERARCHIQUE)[number];
export type DecisionCommission = (typeof DECISIONS_COMMISSION)[number];

/**
 * Couleur du badge par statut de fiche. Les libellés viennent de l'API
 * (`statut_label`) : on ne mappe ici que la couleur. Les états de travail sont
 * en `warning`, les signatures en `primary`, l'issue en `success` / `error`.
 */
export const STATUT_EVALUATION_COLOR: Record<StatutEvaluation, BadgeColor> = {
  en_attente: "neutral",
  en_cours: "warning",
  notee: "warning",
  signee_evaluateur: "primary",
  signee_evalue: "primary",
  en_reclamation: "error",
  en_validation_rh: "warning",
  finalisee: "success",
  rejetee: "error",
  annulee: "neutral",
};

/** Libellé de repli si l'API ne fournit pas `statut_label` (miroir de l'enum PHP). */
export const STATUT_EVALUATION_LABEL: Record<StatutEvaluation, string> = {
  en_attente: "En attente de notation",
  en_cours: "En cours de notation",
  notee: "Notée (non signée)",
  signee_evaluateur: "Signée par le notateur",
  signee_evalue: "Signée par l'agent",
  en_reclamation: "En réclamation",
  en_validation_rh: "En validation RH",
  finalisee: "Finalisée",
  rejetee: "Rejetée",
  annulee: "Annulée",
};

export const STATUT_SESSION_COLOR: Record<StatutSessionEvaluation, BadgeColor> = {
  ouverte: "success",
  cloturee: "neutral",
  annulee: "error",
};

export const STATUT_SESSION_LABEL: Record<StatutSessionEvaluation, string> = {
  ouverte: "Ouverte",
  cloturee: "Clôturée",
  annulee: "Annulée",
};

export const STATUT_RECLAMATION_COLOR: Record<StatutReclamation, BadgeColor> = {
  en_attente: "warning",
  acceptee: "success",
  rejetee: "error",
};

export const STATUT_RECLAMATION_LABEL: Record<StatutReclamation, string> = {
  en_attente: "En attente de traitement",
  acceptee: "Acceptée (renvoi au notateur)",
  rejetee: "Rejetée (maintien de la note)",
};

/** Couleur de la mention /20. La valeur est déjà le libellé côté API. */
export const MENTION_COLOR: Record<MentionEvaluation, BadgeColor> = {
  Excellent: "success",
  "Très bien": "success",
  Bien: "primary",
  Moyen: "warning",
  Insuffisant: "error",
};

/** Libellé et barème d'une famille de critères (CCN : 10 + 3 + 7 = 20 points). */
export const CRITERE_LABEL: Record<TypeCritereEvaluation, string> = {
  competence_pro: "Compétence professionnelle",
  assiduite: "Assiduité",
  relation_sociale: "Relations sociales",
};

/** Total du barème par famille, pour les en-têtes de section de la grille. */
export const CRITERE_TOTAL: Record<TypeCritereEvaluation, number> = {
  competence_pro: 10,
  assiduite: 3,
  relation_sociale: 7,
};

/** Ordre d'affichage des familles dans la grille de notation. */
export const CRITERES_ORDRE: TypeCritereEvaluation[] = [
  "competence_pro",
  "assiduite",
  "relation_sociale",
];

export const NIVEAU_AVIS_LABEL: Record<NiveauAvisHierarchique, string> = {
  chef_bureau: "Chef de Bureau",
  chef_service: "Chef de Service",
  directeur: "Directeur",
  directeur_general: "Directeur Général",
};

export const DECISION_COMMISSION_LABEL: Record<DecisionCommission, string> = {
  favorable: "Favorable (avancement accordé)",
  defavorable: "Défavorable",
  reporte: "Reporté",
};

/**
 * Libellé de l'étape en attente (`prochaine_etape`), affiché en badge à côté du
 * statut : il dit **ce qu'on attend** et **de qui**, là où le statut dit où en
 * est la fiche. Les étapes `inscrire_tableau` / `commission_preparatoire` /
 * `avancer_echelon` appartiennent au tableau d'avancement (lot suivant) : elles
 * sont affichées mais sans bouton.
 */
export const ETAPE_EVALUATION_LABEL: Record<EtapeEvaluation, string> = {
  noter: "À noter (N+1)",
  continuer_notation: "Notation en cours (N+1)",
  avis_et_signer: "Avis et signature (N+1)",
  signer_evalue: "Signature de l'agent",
  envoyer_rh: "Transmission à la RH",
  traiter_reclamation: "Réclamation à traiter (RH)",
  valider_rh: "Validation RH",
  corriger_notation: "Correction attendue (N+1)",
  inscrire_tableau: "À inscrire au tableau (RH)",
  commission_preparatoire: "Attente commission",
  avancer_echelon: "Avancement à appliquer (RH)",
};

/**
 * Statuts à partir desquels le PDF de la fiche est généré côté API (422 avant).
 * Miroir de `EvaluationPdfService` : la fiche n'est éditable qu'une fois signée
 * par l'agent.
 */
export const STATUTS_FICHE_PDF: StatutEvaluation[] = [
  "signee_evalue",
  "en_reclamation",
  "en_validation_rh",
  "finalisee",
  "rejetee",
];

export type StatutCommission = (typeof STATUTS_COMMISSION)[number];
export type StatutBonification = (typeof STATUTS_BONIFICATION)[number];
export type TypeConnaissance = (typeof TYPES_CONNAISSANCE)[number];

export const STATUT_COMMISSION_COLOR: Record<StatutCommission, BadgeColor> = {
  en_cours: "warning",
  cloturee: "neutral",
};

export const STATUT_COMMISSION_LABEL: Record<StatutCommission, string> = {
  en_cours: "En cours",
  cloturee: "Clôturée",
};

/** Bonification de stage (art. 71) et avancement exceptionnel (art. 72). */
export const STATUT_BONIFICATION_COLOR: Record<StatutBonification, BadgeColor> = {
  en_attente: "warning",
  approuvee: "success",
  rejetee: "error",
};

export const STATUT_BONIFICATION_LABEL: Record<StatutBonification, string> = {
  en_attente: "En attente",
  approuvee: "Approuvée",
  rejetee: "Rejetée",
};

export const DECISION_COMMISSION_COLOR: Record<DecisionCommission, BadgeColor> = {
  favorable: "success",
  defavorable: "error",
  reporte: "warning",
};

export const TYPE_CONNAISSANCE_LABEL: Record<TypeConnaissance, string> = {
  formation: "Formation",
  certification: "Certification",
  perfectionnement: "Perfectionnement",
  autre: "Autre",
};

/**
 * Rôle attendu pour donner l'avis d'un niveau hiérarchique (CCN art. 64). Le
 * backend ne le vérifie pas : il se contente de la permission
 * `valider-evaluations`, que tous les chefs possèdent. C'est donc ce mapping qui
 * empêche un chef de bureau de signer à la place du directeur.
 */
export const NIVEAU_AVIS_ROLE: Record<NiveauAvisHierarchique, string> = {
  chef_bureau: "chef-bureau",
  chef_service: "chef-service",
  directeur: "directeur",
  directeur_general: "directeur-general",
};

/**
 * Écart au-delà duquel la commission préparatoire signale une fiche
 * (|note commission − note N+1| > 5). Indicatif, non bloquant côté API.
 */
export const ECART_COMMISSION_ALERTE = 5;
