import type {
  STATUTS_SANCTION,
  ETAPES_SANCTION,
  GRAVITES_SANCTION,
  CODES_TYPE_SANCTION,
} from "~/constants/enums";
import type { BadgeColor } from "~/constants/carriere";
import type { Sanction } from "~/schemas/sanction";

export { agentNom } from "~/constants/carriere";
export type { BadgeColor } from "~/constants/carriere";

export type StatutSanction = (typeof STATUTS_SANCTION)[number];
export type EtapeSanction = (typeof ETAPES_SANCTION)[number];
export type GraviteSanction = (typeof GRAVITES_SANCTION)[number];
export type CodeTypeSanction = (typeof CODES_TYPE_SANCTION)[number];

export const STATUT_SANCTION_COLOR: Record<StatutSanction, BadgeColor> = {
  en_attente: "warning",
  instruite: "primary",
  validee: "error",
  rejetee: "neutral",
};

/** Libellé de repli — l'API fournit `statut_label` (vocabulaire CCN). */
export const STATUT_SANCTION_LABEL: Record<StatutSanction, string> = {
  en_attente: "Rapport soumis",
  instruite: "Instruite — à prononcer",
  validee: "Prononcée",
  rejetee: "Classée sans suite",
};

export const ETAPE_SANCTION_LABEL: Record<EtapeSanction, string> = {
  instruire: "À instruire (RH)",
  prononcer: "À prononcer (DG)",
};

export const GRAVITE_SANCTION_COLOR: Record<GraviteSanction, BadgeColor> = {
  leger: "neutral",
  moyen: "warning",
  grave: "error",
};

export const GRAVITE_SANCTION_LABEL: Record<GraviteSanction, string> = {
  leger: "Léger",
  moyen: "Moyen",
  grave: "Grave",
};

export const CODE_TYPE_SANCTION_LABEL: Record<CodeTypeSanction, string> = {
  avertissement_ecrit: "Avertissement écrit",
  blame_ecrit: "Blâme écrit",
  mise_a_pied: "Mise à pied sans rémunération",
  licenciement: "Licenciement",
};

/** Droits du connecté sur le module disciplinaire. */
export interface ActeurDiscipline {
  /** `consulter-discipline` — listes et dossiers de tous les agents. */
  peutConsulter: boolean;
  /** `gerer-discipline` — types, instruction, avertissements. */
  peutGerer: boolean;
  /** `proposer-discipline` — déposer un rapport (chefs et RH). */
  peutProposer: boolean;
  /** `prononcer-discipline` — prononcer ou classer (DG, admin). */
  peutPrononcer: boolean;
  /** Identifiant utilisateur, pour reconnaître l'auteur d'un rapport. */
  userId?: number | null;
}

/** Action proposée sur un dossier disciplinaire. */
export interface ActionSanction {
  key: "instruire" | "prononcer" | "classer" | "supprimer";
  label: string;
  icon: string;
  color: BadgeColor;
  principale?: boolean;
}

/**
 * Actions ouvertes au connecté sur un dossier, dans l'ordre d'affichage.
 *
 * La séparation des rôles est le cœur de la conformité CCN : la RH instruit
 * mais ne prononce plus, le DG prononce ou classe mais n'instruit pas. On part
 * de `prochaine_etape` (serveur), croisée avec la permission correspondante.
 */
export function actionsSanction(dossier: Sanction, acteur: ActeurDiscipline): ActionSanction[] {
  const actions: ActionSanction[] = [];

  if (dossier.prochaine_etape === "instruire" && acteur.peutGerer) {
    actions.push({
      key: "instruire",
      label: "Instruire le dossier",
      icon: "i-lucide-file-search",
      color: "primary",
      principale: true,
    });
  }

  if (dossier.prochaine_etape === "prononcer" && acteur.peutPrononcer) {
    actions.push({
      key: "prononcer",
      label: "Prononcer la sanction",
      icon: "i-lucide-gavel",
      color: "error",
      principale: true,
    });
    actions.push({
      key: "classer",
      label: "Classer sans suite",
      icon: "i-lucide-archive",
      color: "neutral",
    });
  }

  // Conservation art. 91 : un dossier instruit ou prononcé n'est plus supprimable.
  const auteur = acteur.userId != null && acteur.userId === dossier.created_by;
  if (dossier.statut === "en_attente" && (acteur.peutGerer || auteur)) {
    actions.push({ key: "supprimer", label: "Supprimer le rapport", icon: "i-lucide-trash-2", color: "neutral" });
  }

  return actions;
}

/**
 * Peut-on encore joindre une pièce ? L'auteur du rapport dépose avant
 * l'instruction ; la RH peut compléter le dossier à tout moment.
 */
export function peutJoindrePiece(dossier: Sanction, acteur: ActeurDiscipline): boolean {
  if (acteur.peutGerer) return true;
  const auteur = acteur.userId != null && acteur.userId === dossier.created_by;
  return auteur && dossier.statut === "en_attente";
}

/** La durée (1–8 jours) est-elle attendue pour ce type ? (mise à pied). */
export function exigeNbJours(type?: { exige_nb_jours?: boolean; code?: string | null } | null): boolean {
  return !!type?.exige_nb_jours || type?.code === "mise_a_pied";
}

/** L'indemnité est-elle un choix pour ce type ? (licenciement). */
export function exigeIndemnite(type?: { code?: string | null } | null): boolean {
  return type?.code === "licenciement";
}
