import type {
  TYPES_RECLASSEMENT,
  STATUTS_RECLASSEMENT,
  MOTIFS_RECONVERSION,
  ETAPES_RECLASSEMENT,
} from "~/constants/enums";
import type { BadgeColor } from "~/constants/carriere";

export { agentNom } from "~/constants/carriere";
export type { BadgeColor } from "~/constants/carriere";

export type TypeReclassement = (typeof TYPES_RECLASSEMENT)[number];
export type StatutReclassement = (typeof STATUTS_RECLASSEMENT)[number];
export type MotifReconversion = (typeof MOTIFS_RECONVERSION)[number];
export type EtapeReclassement = (typeof ETAPES_RECLASSEMENT)[number];

/** Libellé de repli — l'API fournit `type_label` et `article`. */
export const TYPE_RECLASSEMENT_LABEL: Record<TypeReclassement, string> = {
  reclassement_formation: "Reclassement après formation (art. 73)",
  reclassement_exceptionnel: "Reclassement exceptionnel (art. 74)",
  hors_classe: "Hors classe (art. 74)",
  reconversion: "Reconversion (art. 75)",
};

export const STATUT_RECLASSEMENT_COLOR: Record<StatutReclassement, BadgeColor> = {
  soumis: "warning",
  approuve: "primary",
  rejete: "error",
  applique: "success",
  annule: "neutral",
};

export const STATUT_RECLASSEMENT_LABEL: Record<StatutReclassement, string> = {
  soumis: "Soumis",
  approuve: "Approuvé",
  rejete: "Rejeté",
  applique: "Appliqué",
  annule: "Annulé",
};

export const ETAPE_RECLASSEMENT_LABEL: Record<EtapeReclassement, string> = {
  approuver: "En attente d'approbation",
  appliquer: "À appliquer (RH)",
};

export const MOTIF_RECONVERSION_LABEL: Record<MotifReconversion, string> = {
  baisse_activite: "Baisse d'activité",
  reorganisation: "Réorganisation interne",
  maladie: "Maladie constatée par médecin agréé",
};

/**
 * Champs attendus par type de dossier : c'est le `type` qui décide de la forme
 * du formulaire (le backend renvoie un 422 ciblé si l'on se trompe).
 */
export interface ChampsReclassement {
  diplome: boolean;
  classeCible: boolean;
  fonctionCible: boolean;
  motifReconversion: boolean;
}

export const CHAMPS_PAR_TYPE: Record<TypeReclassement, ChampsReclassement> = {
  // Art. 73 : le diplôme doit déjà figurer au dossier de l'agent.
  reclassement_formation: { diplome: true, classeCible: false, fonctionCible: false, motifReconversion: false },
  // Art. 74a : la RH choisit la classe visée.
  reclassement_exceptionnel: { diplome: false, classeCible: true, fonctionCible: false, motifReconversion: false },
  // Art. 74b : la cible est la hors-classe, rien à saisir.
  hors_classe: { diplome: false, classeCible: false, fonctionCible: false, motifReconversion: false },
  // Art. 75 : motif réglementaire + poste de reconversion ; classe cible facultative.
  reconversion: { diplome: false, classeCible: true, fonctionCible: true, motifReconversion: true },
};

/**
 * Qui approuve, selon l'article (note rôles backend) : la RH pour l'art. 73,
 * le Directeur Général pour les art. 74 et 75. `admin` passe partout. Le
 * backend renvoie 403 dans le cas contraire : on masque plutôt que de proposer.
 */
export function peutApprouver(
  type: TypeReclassement,
  user: { estRh: boolean; estDg: boolean; estAdmin: boolean },
): boolean {
  if (user.estAdmin) return true;
  return type === "reclassement_formation" ? user.estRh : user.estDg;
}
