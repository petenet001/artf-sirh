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
  "DRHL",
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
 * Statuts réellement modifiables via `PUT /integration/agents/{id}`.
 *
 * Le FormRequest en accepte davantage, mais le service rejette ensuite les
 * quatre **positions conventionnelles** (art. 76–80) avec un 422
 * `errors.statut` : elles passent par `POST /carriere/positions`. `stagiaire`
 * (module stage) et `archive` (archiver / désarchiver) ont aussi leur parcours.
 */
export const STATUTS_AGENT_MODIFIABLES = ["actif", "inactif", "suspendu", "retraite"] as const;

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

/**
 * App\Enums\StatutEvaluation — cycle d'une fiche d'évaluation (CCN art. 63–70).
 * Le libellé vient de l'API (`statut_label`) ; couleurs dans `constants/evaluations.ts`.
 */
export const STATUTS_EVALUATION = [
  "en_attente",
  "en_cours",
  "notee",
  "signee_evaluateur",
  "signee_evalue",
  "en_reclamation",
  "en_validation_rh",
  "finalisee",
  "rejetee",
  "annulee",
] as const;

/** App\Enums\StatutSessionEvaluation — cycle d'une session d'évaluation. */
export const STATUTS_SESSION_EVALUATION = ["ouverte", "cloturee", "annulee"] as const;

/** App\Enums\StatutReclamation — traitement RH d'une réclamation (CCN art. 65). */
export const STATUTS_RECLAMATION = ["en_attente", "acceptee", "rejetee"] as const;

/**
 * App\Enums\MentionEvaluation — la **valeur** est déjà le libellé (l'API renvoie
 * « Très bien »). Seuils /20 : ≥16 Excellent, ≥14 Très bien, ≥12 Bien, ≥10 Moyen.
 */
export const MENTIONS_EVALUATION = ["Excellent", "Très bien", "Bien", "Moyen", "Insuffisant"] as const;

/**
 * Familles de critères de la grille (24 questions seedées) et barème CCN :
 * compétence professionnelle /10, assiduité /3, relations sociales /7 = 20 pts.
 */
export const TYPES_CRITERE_EVALUATION = ["competence_pro", "assiduite", "relation_sociale"] as const;

/**
 * Étape en attente sur une fiche (champ serveur `prochaine_etape`, dérivé du
 * seul statut). **Source de vérité runtime** de l'action à proposer : ne jamais
 * la déduire du statut côté front. `null` = fiche terminée ou annulée.
 */
export const ETAPES_EVALUATION = [
  "noter",
  "continuer_notation",
  "avis_et_signer",
  "signer_evalue",
  "envoyer_rh",
  "traiter_reclamation",
  "valider_rh",
  "corriger_notation",
  "inscrire_tableau",
  "commission_preparatoire",
  "avancer_echelon",
] as const;

/** Parité d'année d'embauche ciblée par une session (éligibilité, art. 62). */
export const TYPES_ANNEE_SESSION = ["paire", "impaire"] as const;

/** App\Enums\NiveauAvisHierarchique — chaîne d'avis de la hiérarchie (CCN art. 64). */
export const NIVEAUX_AVIS_HIERARCHIQUE = [
  "chef_bureau",
  "chef_service",
  "directeur",
  "directeur_general",
] as const;

/** App\Enums\DecisionCommission — décision de la commission d'avancement (art. 69–70). */
export const DECISIONS_COMMISSION = ["favorable", "defavorable", "reporte"] as const;

/** App\Enums\StatutCommission — commission préparatoire ou d'avancement (art. 68–70). */
export const STATUTS_COMMISSION = ["en_cours", "cloturee"] as const;

/**
 * App\Enums\StatutBonification — partagé par la bonification de stage (art. 71)
 * **et** l'avancement exceptionnel (art. 72) : même cycle de décision.
 */
export const STATUTS_BONIFICATION = ["en_attente", "approuvee", "rejetee"] as const;

/** Pièce justifiant une bonification de stage (art. 71). */
export const TYPES_DOCUMENT_BONIFICATION = ["certificat", "attestation"] as const;

/** Nature d'un besoin de formation relevé pendant l'évaluation. */
export const TYPES_CONNAISSANCE = ["formation", "certification", "perfectionnement", "autre"] as const;

/** App\Enums\TypeReclassement — les quatre parcours des art. 73–75. */
export const TYPES_RECLASSEMENT = [
  "reclassement_formation",
  "reclassement_exceptionnel",
  "hors_classe",
  "reconversion",
] as const;

/** App\Enums\StatutReclassement — cycle d'un dossier de reclassement. */
export const STATUTS_RECLASSEMENT = ["soumis", "approuve", "rejete", "applique", "annule"] as const;

/** App\Enums\MotifReconversion — motif imposé par l'art. 75. */
export const MOTIFS_RECONVERSION = ["baisse_activite", "reorganisation", "maladie"] as const;

/**
 * Étape en attente sur un dossier de reclassement (`prochaine_etape`).
 * `null` = dossier clos (appliqué, rejeté ou annulé).
 */
export const ETAPES_RECLASSEMENT = ["approuver", "appliquer"] as const;

/** App\Enums\StatutSanction — cycle d'un dossier disciplinaire (CCN art. 90–91). */
export const STATUTS_SANCTION = ["en_attente", "instruite", "validee", "rejetee"] as const;

/**
 * Étape en attente sur un dossier disciplinaire (`prochaine_etape`).
 * ⚠️ Depuis la mise en conformité CCN, c'est le **DG seul** qui prononce :
 * l'étape après instruction est `prononcer`, plus `valider`.
 */
export const ETAPES_SANCTION = ["instruire", "prononcer"] as const;

/** App\Enums\GraviteSanction — gravité d'un type de sanction. */
export const GRAVITES_SANCTION = ["leger", "moyen", "grave"] as const;

/**
 * App\Enums\CodeTypeSanction — les quatre types retenus par la CCN (art. 90).
 * Les types hors CCN (mutation d'office, rétrogradation) sont désactivés au seed.
 */
export const CODES_TYPE_SANCTION = [
  "avertissement_ecrit",
  "blame_ecrit",
  "mise_a_pied",
  "licenciement",
] as const;

/** App\Enums\TypeOrganismeSocial — nature d'un organisme social. */
export const TYPES_ORGANISME_SOCIAL = ["cnss", "mutuelle", "complementaire", "autre"] as const;

/** App\Enums\StatutAffiliation — état d'une affiliation à un organisme. */
export const STATUTS_AFFILIATION = ["active", "suspendue", "cloturee"] as const;

/** App\Enums\TypeAyantDroit — nature d'un ayant droit (CCN art. 58–59). */
export const TYPES_AYANT_DROIT = ["conjoint", "enfant"] as const;

/**
 * App\Enums\LienJuridiqueAyantDroit — lien avec l'agent. Les deux premiers
 * concernent le conjoint, les autres les enfants.
 */
export const LIENS_JURIDIQUES_AYANT_DROIT = [
  "mariage",
  "union_libre",
  "naturel_reconnu",
  "adoption",
  "tutelle",
] as const;

/**
 * App\Enums\QualiteAgeAyantDroit — régime d'âge d'un enfant à charge :
 * `standard` < 16 ans, `apprentissage` < 17, `etudes` / `infirmite` < 21.
 */
export const QUALITES_AGE_AYANT_DROIT = ["standard", "apprentissage", "etudes", "infirmite"] as const;

/** App\Enums\TypePieceAyantDroit — pièce justificative d'un ayant droit. */
export const TYPES_PIECE_AYANT_DROIT = [
  "acte_naissance",
  "acte_mariage",
  "jugement_tutelle",
  "certificat_scolarite",
  "certificat_apprentissage",
  "certificat_medical",
  "autre",
] as const;

/** App\Enums\TypePositionConventionnelle — positions CCN art. 76–80. */
export const TYPES_POSITION = [
  "detachement",
  "disponibilite",
  "position_exceptionnelle",
  "sous_le_drapeau",
] as const;

/** App\Enums\StatutPositionConventionnelle — cycle d'une position. */
export const STATUTS_POSITION = ["soumise", "active", "cloturee", "rejetee"] as const;

/** Étape en attente sur une position (`prochaine_etape`). */
export const ETAPES_POSITION = ["approuver", "cloturer"] as const;

/**
 * App\Enums\StatutEssai — période d'essai d'un contrat (art. 49) ou d'une
 * nomination sur emploi supérieur (art. 50). `non_applicable` = pas d'essai.
 */
export const STATUTS_ESSAI = ["en_cours", "renouvele", "concluant", "rompu", "non_applicable"] as const;

/** App\Enums\MotifAffectation — motif codifié d'une affectation (art. 81–82). */
export const MOTIFS_AFFECTATION = ["rapprochement_conjoints"] as const;

/**
 * App\Enums\PieceRapprochement — les quatre pièces exigées pour un
 * rapprochement de conjoints (art. 81–82). Toutes obligatoires.
 */
export const PIECES_RAPPROCHEMENT = [
  "demande_manuscrite",
  "acte_mariage",
  "note_affectation_conjoint",
  "attestation_residence",
] as const;

/** App\Enums\MotifArchivage — motif codifié de sortie des effectifs (art. 48). */
export const MOTIFS_ARCHIVAGE = [
  "diminution_activite",
  "reorganisation",
  "retraite",
  "demission",
  "licenciement",
  "autre",
] as const;

/** App\Enums\TypeActionFormation — nature de l'action de formation (art. 92–104). */
export const TYPES_ACTION_FORMATION = [
  "sur_le_tas",
  "seminaire",
  "perfectionnement",
  "qualification",
  "ecole",
  "camrtf",
] as const;

/** App\Enums\ModaliteFormation — formation interne ou externe. */
export const MODALITES_FORMATION = ["interne", "externe"] as const;

/** App\Enums\StatutPlanFormation — cycle du plan annuel de formation. */
export const STATUTS_PLAN_FORMATION = ["brouillon", "valide", "execute", "cloture"] as const;

/** App\Enums\StatutInscriptionFormation — parcours d'une inscription. */
export const STATUTS_INSCRIPTION_FORMATION = [
  "inscrite",
  "presente",
  "terminee",
  "annulee",
  "absente",
] as const;

/** App\Enums\NaturePaieElement — famille d'un élément de paie (art. 54–59). */
export const NATURES_PAIE_ELEMENT = [
  "prime",
  "indemnite",
  "allocation",
  "retenue",
  "salaire_fonctionnel",
] as const;

/** App\Enums\SensPaieElement — dérivé de la nature, jamais saisi. */
export const SENS_PAIE_ELEMENT = ["gain", "retenue"] as const;

/** App\Enums\PeriodicitePaieElement — rythme de versement. */
export const PERIODICITES_PAIE_ELEMENT = [
  "mensuel",
  "semestriel",
  "annuel",
  "ponctuel",
  "journalier",
] as const;

/** App\Enums\ModeCalculPaieElement — comment le montant est obtenu. */
export const MODES_CALCUL_PAIE_ELEMENT = [
  "montant_fixe",
  "pourcentage_base",
  "formule_ccn",
  "bareme_ccn",
] as const;

/** App\Enums\StatutPaieLot — cycle du lot mensuel de paie. */
export const STATUTS_PAIE_LOT = ["brouillon", "genere", "controle", "valide", "cloture"] as const;

/** App\Enums\SourceDetailPaie — d'où vient une ligne de détail du bulletin. */
export const SOURCES_DETAIL_PAIE = ["base", "affectation", "calcul_auto"] as const;

/** Zone de l'indemnité de formation (art. 104) : hors Afrique, le SMIG local s'applique. */
export const ZONES_INDEMNITE_FORMATION = ["afrique", "autre"] as const;

/** Cause prolongeant un intérim au-delà de 6 mois. */
export const CAUSES_PROLONGATION_INTERIM = ["maladie", "accident_travail"] as const;

// ── Prestations sociales (D.3.4) et Santé (D.3.5) ────────────────────────────

/**
 * App\Enums\StatutPrestation **et** App\Enums\StatutDossierSante — deux énums
 * backend distincts, aux valeurs strictement identiques. Le front n'en garde
 * qu'une : les trois dossiers (prestation, prise en charge, arrêt) suivent le
 * même circuit et se pilotent avec le même code.
 */
export const STATUTS_DOSSIER_SOCIAL = [
  "brouillon",
  "soumise",
  "instruite",
  "accordee",
  "refusee",
  "classee",
] as const;

/**
 * Étape suivante d'un dossier social (champ serveur `prochaine_etape`).
 * `null` = circuit terminé. **Source de vérité runtime** du bouton à afficher.
 */
export const ETAPES_DOSSIER_SOCIAL = ["soumettre", "instruire", "accorder"] as const;

/** App\Enums\TypePrestation — prestations CCN ponctuelles (art. 119–121). */
export const TYPES_PRESTATION = [
  "capital_deces",
  "prime_enfants_deces",
  "frais_funeraires",
  "allocation_deces_retraite",
  "indemnite_retraite",
] as const;

/** App\Enums\TypePiecePrestation — pièces justificatives d'une prestation. */
export const TYPES_PIECE_PRESTATION = [
  "acte_deces",
  "facture",
  "certificat",
  "decision_retraite",
  "autre",
] as const;

/** App\Enums\NatureArretSante — origine de l'arrêt (art. 132–135). */
export const NATURES_ARRET_SANTE = [
  "maladie",
  "accident_travail",
  "maladie_professionnelle",
  "accident_non_professionnel",
] as const;

/** App\Enums\TypePriseEnCharge — frais médicaux pris en charge (art. 122–127). */
export const TYPES_PRISE_EN_CHARGE = [
  "honoraires_soins",
  "pharmaceutique",
  "verres_correcteurs",
  "hospitalisation",
  "evacuation_sanitaire",
] as const;

/** App\Enums\TypePieceSante — pièces d'un dossier santé. */
export const TYPES_PIECE_SANTE = [
  "facture",
  "ordonnance",
  "certificat",
  "rapport_medical",
  "autre",
] as const;

/** App\Enums\TypeVisiteMedicale — motif de la visite. */
export const TYPES_VISITE_MEDICALE = ["embauche", "annuelle", "consultation"] as const;

/** App\Enums\TypeStructureSanitaire — nature du prestataire agréé. */
export const TYPES_STRUCTURE_SANITAIRE = [
  "medecin",
  "formation_sanitaire",
  "opticien",
  "pharmacie",
] as const;

/**
 * `User::vuePersonnel()` — périmètre effectif d'un compte sur le personnel.
 *
 * `globale` couvre deux cas que rien ne distingue à l'écran : le compte sans
 * bureau de rattachement, et celui qui en a un mais porte
 * `consulter-agents-global` (tout le métier RH). Dans les deux cas il voit
 * l'effectif entier — c'est ce qui compte pour l'utilisateur.
 */
export const VUES_PERSONNEL = ["globale", "direction", "service", "bureau"] as const;
