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

/**
 * App\Enums\StatutAgent — position de l'agent (CCN ARTF art. 76–80). L'API ne
 * renvoie pas de `statut_label` : libellés et couleurs dans `constants/personnel.ts`.
 */
export const STATUTS_AGENT = [
  "actif",
  "inactif",
  "suspendu",
  "retraite",
  "stagiaire",
  "archive",
  "detachement",
  "position_exceptionnelle",
  "disponibilite",
  "sous_le_drapeau",
] as const;

/**
 * StatutAgent::modifiablesParRh() — valeurs acceptées par `PUT
 * /integration/agents/{id}`. `stagiaire` (module stage) et `archive`
 * (archiver / désarchiver) ont leur propre parcours : 422 si on les envoie.
 */
export const STATUTS_AGENT_MODIFIABLES = [
  "actif",
  "inactif",
  "suspendu",
  "retraite",
  "detachement",
  "position_exceptionnelle",
  "disponibilite",
  "sous_le_drapeau",
] as const;

/**
 * App\Enums\StatutAffectation — cycle de vie d'une affectation (module carrière).
 * ⚠️ Distinct de la nomination : `en_attente_validation` et `terminee`.
 */
export const STATUTS_AFFECTATION = [
  "en_attente_validation",
  "approuvee",
  "active",
  "terminee",
  "rejetee",
] as const;

/**
 * App\Enums\StatutNomination — cycle de vie d'une nomination (module carrière).
 * ⚠️ Distinct de l'affectation : `en_attente` et `cloturee`.
 */
export const STATUTS_NOMINATION = [
  "en_attente",
  "approuvee",
  "active",
  "cloturee",
  "rejetee",
] as const;

/** App\Enums\TypeActeNomination — nature de l'acte d'une nomination. */
export const TYPES_ACTE_NOMINATION = ["arrete", "decision", "note_service"] as const;

/** App\Enums\StatutSalaireAgent — état d'une ligne de salaire d'agent. */
export const STATUTS_SALAIRE_AGENT = ["actif", "cloture"] as const;

/** App\Enums\TypeChangementSalaireAgent — origine d'un changement de salaire. */
export const TYPES_CHANGEMENT_SALAIRE_AGENT = [
  "initial",
  "avancement_echelon",
  "correction",
  "revalorisation",
  // Reclassements CCN art. 73–75 (`/carriere/reclassements`).
  "reclassement",
  "hors_classe",
  "reconversion",
] as const;

/** App\Enums\StatutDemandeConge — cycle d'une demande de congé (circuit N+1 → RH → DG). */
export const STATUTS_DEMANDE_CONGE = [
  "soumise",
  // Retirée par le demandeur tant qu'elle était `soumise` (POST …/annuler).
  "annulee",
  "validee_n1",
  "rejetee_n1",
  "validee_rh",
  "rejetee_rh",
  "validee_dg",
  "rejetee_dg",
] as const;

/**
 * Étape de validation en attente sur une demande de congé (champ serveur
 * `prochaine_etape`). `null` = circuit terminé (validé ou rejeté). **Source de
 * vérité runtime** du bouton à afficher (ne pas déduire du statut seul).
 */
export const ETAPES_CONGE = ["valider-n1", "valider-rh", "valider-dg"] as const;

/** App\Enums\StatutAbsence — cycle d'une absence (circuit unique, pas de N+1/RH/DG). */
export const STATUTS_ABSENCE = ["en_attente", "validee", "rejetee"] as const;

/** Statut matrimonial (SituationFamiliale\UpsertRequest). */
export const STATUTS_MATRIMONIAUX = ["celibataire", "marie", "divorce", "veuf", "union_libre"] as const;

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
