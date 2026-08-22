/**
 * Énumérations métier reflétant les enums PHP du backend.
 * Source : app/Enums/* de project-api-rh-artf. Les libellés (`*_label`) sont
 * fournis directement par l'API ; ces tableaux servent surtout aux <select>.
 */

/** App\Enums\StatutDossier — cycle de vie d'un dossier d'intégration. */
export const STATUTS_DOSSIER = [
  "BROUILLON",
  "SOUMIS",
  "EN_ETUDE_RH",
  "DOSSIER_INCOMPLET",
  "DOSSIER_COMPLET",
  "VALIDE_RH",
  "EN_ATTENTE_DG",
  "VALIDE_DG",
  "ACTE_GENERE",
  "CONTRAT_SIGNE",
  "MATRICULE_CREE",
  "AFFECTE",
  "NOMME",
  "COMPTE_CREE",
  "PRISE_DE_SERVICE",
  "INTEGRE",
  "SUSPENDU",
  "REJETE",
  "ANNULE",
] as const;

/** App\Enums\NiveauValidation — niveaux du circuit de validation. */
export const NIVEAUX_VALIDATION = [
  "chef_bureau",
  "chef_service",
  "directeur",
  "drh",
  "directeur_general",
] as const;

/** App\Enums\TypeActeAdministratif — types d'actes générables. */
export const TYPES_ACTE_ADMINISTRATIF = [
  "decision_recrutement",
  "contrat",
  "decision_mutation",
  "arrete_detachement",
  "decision_affectation",
  "decision_nomination",
  "pv_prise_de_service",
  "note_de_service",
] as const;

/** Statut d'un agent (Agent/UpdateRequest + migration `add_stagiaire_to_agents_statut`). */
export const STATUTS_AGENT = ["actif", "inactif", "suspendu", "retraite", "stagiaire"] as const;

/** App\Enums\StatutSalaireAgent — état d'une ligne de salaire d'agent. */
export const STATUTS_SALAIRE_AGENT = ["actif", "cloture"] as const;

/** App\Enums\TypeChangementSalaireAgent — origine d'un changement de salaire. */
export const TYPES_CHANGEMENT_SALAIRE_AGENT = [
  "initial",
  "avancement_echelon",
  "correction",
  "revalorisation",
] as const;

/** App\Enums\TypeStage — nature d'une convention de stage. */
export const TYPES_STAGE = ["academique", "professionnel", "qualification"] as const;

/** App\Enums\StatutConventionStage — cycle de vie d'une convention de stage. */
export const STATUTS_CONVENTION_STAGE = ["EN_COURS", "TERMINE", "ROMPU"] as const;

/** Genre (Agent). */
export const GENRES = ["M", "F"] as const;

/**
 * Types polymorphes (`structurable_type`) acceptés par l'API pour les
 * affectations / nominations / dossiers.
 */
export const STRUCTURABLE_TYPES = [
  "App\\Models\\Direction",
  "App\\Models\\Service",
  "App\\Models\\Bureau",
] as const;
