import type { STATUTS_DOSSIER } from "~/constants/enums";

/**
 * Modèle de workflow du dossier d'intégration : c'est lui qui pilote l'UI.
 * Source de vérité = `dossier.statut`. On en dérive la phase, la couleur du
 * badge et l'ACTION PRINCIPALE proposée à l'utilisateur (une seule à la fois).
 */
export type DossierStatut = (typeof STATUTS_DOSSIER)[number];

export type BadgeColor = "primary" | "secondary" | "success" | "warning" | "error" | "neutral";

/** Clé d'action principale, mappée à un handler dans l'espace dossier. */
export type ActionKey =
  | "soumettre"
  | "passerEnEtudeRH"
  | "marquerComplet"
  | "validerRH"
  | "genererActe"
  | "marquerContratSigne"
  | "assignerMatricule"
  | "affecter"
  | "creerCompte"
  | "priseService"
  | "integrer";

export interface ActionDef {
  key: ActionKey;
  label: string;
  icon: string;
}

export interface PhaseDef {
  key: string;
  label: string;
  icon: string;
  statuts: DossierStatut[];
}

/** Les 6 phases lisibles regroupant les 19 états. */
export const INTEGRATION_PHASES: PhaseDef[] = [
  { key: "demande", label: "Demande", icon: "i-lucide-file-plus-2", statuts: ["BROUILLON", "SOUMIS"] },
  { key: "constitution", label: "Constitution du dossier", icon: "i-lucide-folder-open", statuts: ["EN_ETUDE_RH", "DOSSIER_INCOMPLET", "DOSSIER_COMPLET"] },
  { key: "validation", label: "Validation hiérarchique", icon: "i-lucide-shield-check", statuts: ["VALIDE_RH", "EN_ATTENTE_DG", "VALIDE_DG"] },
  { key: "acte", label: "Acte & matricule", icon: "i-lucide-stamp", statuts: ["ACTE_GENERE", "CONTRAT_SIGNE", "MATRICULE_CREE"] },
  { key: "miseEnPlace", label: "Mise en place", icon: "i-lucide-briefcase", statuts: ["AFFECTE", "NOMME", "COMPTE_CREE"] },
  { key: "priseService", label: "Prise de service", icon: "i-lucide-badge-check", statuts: ["PRISE_DE_SERVICE", "INTEGRE"] },
];

/** Libellé + couleur par statut (le libellé API `statut_label` prime si présent). */
export const STATUT_META: Record<DossierStatut, { label: string; color: BadgeColor }> = {
  BROUILLON: { label: "Brouillon", color: "neutral" },
  SOUMIS: { label: "Soumis", color: "primary" },
  EN_ETUDE_RH: { label: "En étude RH", color: "warning" },
  DOSSIER_INCOMPLET: { label: "Dossier incomplet", color: "error" },
  DOSSIER_COMPLET: { label: "Dossier complet", color: "primary" },
  VALIDE_RH: { label: "Validé RH", color: "primary" },
  EN_ATTENTE_DG: { label: "En attente DG", color: "warning" },
  VALIDE_DG: { label: "Validé DG", color: "success" },
  ACTE_GENERE: { label: "Acte généré", color: "primary" },
  CONTRAT_SIGNE: { label: "Contrat signé", color: "primary" },
  MATRICULE_CREE: { label: "Matricule créé", color: "primary" },
  AFFECTE: { label: "Affecté", color: "primary" },
  NOMME: { label: "Nommé", color: "primary" },
  COMPTE_CREE: { label: "Compte créé", color: "primary" },
  PRISE_DE_SERVICE: { label: "Prise de service", color: "primary" },
  INTEGRE: { label: "Intégré", color: "success" },
  SUSPENDU: { label: "Suspendu", color: "warning" },
  REJETE: { label: "Rejeté", color: "error" },
  ANNULE: { label: "Annulé", color: "neutral" },
};

/** Action principale proposée selon le statut (absente = rien à faire ici). */
export const PRIMARY_ACTION: Partial<Record<DossierStatut, ActionDef>> = {
  BROUILLON: { key: "soumettre", label: "Soumettre le dossier", icon: "i-lucide-send" },
  SOUMIS: { key: "passerEnEtudeRH", label: "Prendre en charge (RH)", icon: "i-lucide-clipboard-check" },
  EN_ETUDE_RH: { key: "marquerComplet", label: "Marquer le dossier complet", icon: "i-lucide-folder-check" },
  DOSSIER_INCOMPLET: { key: "marquerComplet", label: "Marquer le dossier complet", icon: "i-lucide-folder-check" },
  DOSSIER_COMPLET: { key: "validerRH", label: "Valider RH — lancer le circuit", icon: "i-lucide-shield-check" },
  VALIDE_DG: { key: "genererActe", label: "Générer l'acte administratif", icon: "i-lucide-stamp" },
  ACTE_GENERE: { key: "marquerContratSigne", label: "Marquer le contrat signé", icon: "i-lucide-file-signature" },
  CONTRAT_SIGNE: { key: "assignerMatricule", label: "Assigner le matricule", icon: "i-lucide-hash" },
  MATRICULE_CREE: { key: "affecter", label: "Affecter l'agent", icon: "i-lucide-map-pin" },
  AFFECTE: { key: "creerCompte", label: "Créer le compte utilisateur", icon: "i-lucide-user-cog" },
  NOMME: { key: "creerCompte", label: "Créer le compte utilisateur", icon: "i-lucide-user-cog" },
  COMPTE_CREE: { key: "priseService", label: "Confirmer la prise de service", icon: "i-lucide-badge-check" },
  PRISE_DE_SERVICE: { key: "integrer", label: "Finaliser l'intégration", icon: "i-lucide-flag" },
};

/** Indice d'aide affiché sous le statut courant. */
export const STATUT_HINT: Partial<Record<DossierStatut, string>> = {
  EN_ETUDE_RH: "Déposez et validez les pièces justificatives, puis marquez le dossier complet.",
  DOSSIER_INCOMPLET: "Complétez les pièces manquantes avant de remarquer le dossier complet.",
  VALIDE_RH: "Le circuit de validation hiérarchique est en cours — voir l'onglet « Circuit ».",
  EN_ATTENTE_DG: "En attente de la validation du Directeur Général — voir l'onglet « Circuit ».",
  AFFECTE: "Le compte peut être créé. La nomination est optionnelle (postes de responsabilité).",
};

/** États terminaux / anormaux : plus d'action principale. */
export const TERMINAL_STATUTS: DossierStatut[] = ["INTEGRE", "REJETE", "ANNULE", "SUSPENDU"];

/** Phase contenant un statut donné (ou null). */
export function phaseOf(statut: DossierStatut): PhaseDef | null {
  return INTEGRATION_PHASES.find((p) => p.statuts.includes(statut)) ?? null;
}

/** Progression 0..1 basée sur la phase atteinte. */
export function progressOf(statut: DossierStatut): number {
  const idx = INTEGRATION_PHASES.findIndex((p) => p.statuts.includes(statut));
  if (idx < 0) return 0;
  return (idx + 1) / INTEGRATION_PHASES.length;
}
