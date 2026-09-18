import type {
  STATUTS_DOSSIER_SOCIAL,
  ETAPES_DOSSIER_SOCIAL,
  TYPES_PRESTATION,
  TYPES_PIECE_PRESTATION,
  NATURES_ARRET_SANTE,
  TYPES_PRISE_EN_CHARGE,
  TYPES_PIECE_SANTE,
  TYPES_VISITE_MEDICALE,
  TYPES_STRUCTURE_SANITAIRE,
} from "~/constants/enums";
import type { BadgeColor } from "~/constants/carriere";

export { agentNom } from "~/constants/carriere";
export type { BadgeColor } from "~/constants/carriere";

export type StatutDossierSocial = (typeof STATUTS_DOSSIER_SOCIAL)[number];
export type EtapeDossierSocial = (typeof ETAPES_DOSSIER_SOCIAL)[number];
export type TypePrestation = (typeof TYPES_PRESTATION)[number];
export type TypePiecePrestation = (typeof TYPES_PIECE_PRESTATION)[number];
export type NatureArretSante = (typeof NATURES_ARRET_SANTE)[number];
export type TypePriseEnCharge = (typeof TYPES_PRISE_EN_CHARGE)[number];
export type TypePieceSante = (typeof TYPES_PIECE_SANTE)[number];
export type TypeVisiteMedicale = (typeof TYPES_VISITE_MEDICALE)[number];
export type TypeStructureSanitaire = (typeof TYPES_STRUCTURE_SANITAIRE)[number];

// ── Circuit commun aux trois dossiers ────────────────────────────────────────

export const STATUT_DOSSIER_SOCIAL_LABEL: Record<StatutDossierSocial, string> = {
  brouillon: "Brouillon",
  soumise: "Soumise",
  instruite: "Instruite",
  accordee: "Accordée",
  refusee: "Refusée",
  classee: "Classée",
};

/**
 * Couleur du statut. `classee` reste neutre : un dossier classé sans suite
 * n'est ni un succès ni un échec, et le peindre en rouge accuserait à tort.
 */
export const STATUT_DOSSIER_SOCIAL_COLOR: Record<StatutDossierSocial, BadgeColor> = {
  brouillon: "neutral",
  // `primary` et non une couleur d'état : une demande soumise n'est ni un
  // succès ni un avertissement, elle est simplement en route.
  soumise: "primary",
  instruite: "warning",
  accordee: "success",
  refusee: "error",
  classee: "neutral",
};

/** Un dossier encore modifiable (pièces comprises) n'existe qu'en brouillon. */
export function dossierModifiable(statut?: StatutDossierSocial | null): boolean {
  return statut === "brouillon";
}

/** Le circuit est-il allé jusqu'à une décision (ou un classement) ? */
export function dossierClos(statut?: StatutDossierSocial | null): boolean {
  return statut === "accordee" || statut === "refusee" || statut === "classee";
}

export interface ActionDossierSocial {
  cle: "soumettre" | "instruire" | "accorder" | "refuser" | "classer";
  libelle: string;
  icone: string;
  /** Ce que le bouton fait vraiment, pour l'infobulle. */
  aide: string;
  couleur: BadgeColor;
}

/** Droits du connecté vis-à-vis d'un dossier social. */
export interface ActeurDossierSocial {
  /** `gerer-affaires-sociales` : créer, instruire, classer, déposer des pièces. */
  peutGerer: boolean;
  /** `decider-prestations` : accorder ou refuser. Le DG, et l'admin. */
  peutDecider: boolean;
}

/**
 * Actions ouvertes sur un dossier, pour cet acteur.
 *
 * Deux sources se croisent, et **aucune des deux ne suffit seule** :
 *
 * - `prochaine_etape`, que le serveur calcule et qui dit où en est le circuit.
 *   On ne le déduit pas du statut : c'est le serveur qui fait autorité, et un
 *   statut peut gagner une étape sans que le front soit redéployé ;
 * - la permission du connecté, qui dit s'il a le droit de franchir cette étape.
 *   L'API vérifie la permission de route mais **pas** l'identité de l'acteur :
 *   c'est donc au front de ne pas proposer un bouton qui finira en 403.
 *
 * `classer` est à part : il ne fait pas avancer le circuit, il l'arrête. Il
 * reste donc offert tant que le dossier n'est pas clos, quelle que soit l'étape.
 */
export function actionsDossierSocial(
  dossier: { statut?: StatutDossierSocial | null; prochaine_etape?: EtapeDossierSocial | null },
  acteur: ActeurDossierSocial,
): ActionDossierSocial[] {
  const actions: ActionDossierSocial[] = [];
  const etape = dossier.prochaine_etape;

  if (etape === "soumettre" && acteur.peutGerer) {
    actions.push({
      cle: "soumettre",
      libelle: "Soumettre",
      icone: "i-lucide-send",
      aide: "Envoie le dossier à l'instruction. Il ne sera plus modifiable.",
      couleur: "primary",
    });
  }

  if (etape === "instruire" && acteur.peutGerer) {
    actions.push({
      cle: "instruire",
      libelle: "Instruire",
      icone: "i-lucide-search",
      aide: "Consigne l'examen du dossier et le présente à la décision.",
      couleur: "primary",
    });
  }

  if (etape === "accorder" && acteur.peutDecider) {
    actions.push({
      cle: "accorder",
      libelle: "Accorder",
      icone: "i-lucide-check",
      aide: "Accorde la prestation et la pose en paie sur le mois choisi.",
      couleur: "success",
    });
    actions.push({
      cle: "refuser",
      libelle: "Refuser",
      icone: "i-lucide-x",
      aide: "Refuse la demande. Le motif est obligatoire.",
      couleur: "error",
    });
  }

  if (!dossierClos(dossier.statut) && acteur.peutGerer) {
    actions.push({
      cle: "classer",
      libelle: "Classer sans suite",
      icone: "i-lucide-archive",
      aide: "Clôt le dossier sans décision — demande abandonnée ou sans objet.",
      couleur: "neutral",
    });
  }

  return actions;
}

// ── Prestations (D.3.4) ──────────────────────────────────────────────────────

export const TYPE_PRESTATION_LABEL: Record<TypePrestation, string> = {
  capital_deces: "Capital décès",
  prime_enfants_deces: "Prime enfants à charge (décès)",
  frais_funeraires: "Frais funéraires",
  allocation_deces_retraite: "Allocation décès salarié retraité",
  indemnite_retraite: "Indemnité d'admission à la retraite",
};

/** Article de la CCN dont chaque prestation tire sa base légale. */
export const ARTICLE_PRESTATION: Record<TypePrestation, string> = {
  capital_deces: "art. 121",
  prime_enfants_deces: "art. 121",
  frais_funeraires: "art. 121",
  allocation_deces_retraite: "art. 120",
  indemnite_retraite: "art. 119",
};

export const TYPE_PIECE_PRESTATION_LABEL: Record<TypePiecePrestation, string> = {
  acte_deces: "Acte de décès",
  facture: "Facture",
  certificat: "Certificat",
  decision_retraite: "Décision de retraite",
  autre: "Autre",
};

/**
 * Le montant est-il **saisi** par le demandeur, ou **calculé** par le barème ?
 *
 * Seuls les frais funéraires sont saisis : on rembourse une dépense justifiée,
 * sous plafond. Tout le reste découle de l'ancienneté et du traitement — y
 * laisser un champ de saisie laisserait croire qu'on peut négocier le barème.
 */
export function montantSaisi(type?: TypePrestation | null): boolean {
  return type === "frais_funeraires";
}

/** Le type vise-t-il un décès ? Conditionne la saisie du bénéficiaire. */
export function prestationDeDeces(type?: TypePrestation | null): boolean {
  return (
    type === "capital_deces" ||
    type === "prime_enfants_deces" ||
    type === "frais_funeraires" ||
    type === "allocation_deces_retraite"
  );
}

// ── Santé (D.3.5) ────────────────────────────────────────────────────────────

export const NATURE_ARRET_LABEL: Record<NatureArretSante, string> = {
  maladie: "Maladie",
  accident_travail: "Accident du travail",
  maladie_professionnelle: "Maladie professionnelle",
  accident_non_professionnel: "Accident non professionnel",
};

/**
 * Un arrêt d'origine professionnelle ouvre des droits plus larges (art. 133) :
 * on le signale, parce que c'est ce qui change l'instruction.
 */
export function origineProfessionnelle(nature?: NatureArretSante | null): boolean {
  return nature === "accident_travail" || nature === "maladie_professionnelle";
}

export const TYPE_PRISE_EN_CHARGE_LABEL: Record<TypePriseEnCharge, string> = {
  honoraires_soins: "Honoraires et soins",
  pharmaceutique: "Frais pharmaceutiques",
  verres_correcteurs: "Verres correcteurs",
  hospitalisation: "Hospitalisation",
  evacuation_sanitaire: "Évacuation sanitaire",
};

export const ARTICLE_PRISE_EN_CHARGE: Record<TypePriseEnCharge, string> = {
  honoraires_soins: "art. 123",
  pharmaceutique: "art. 124",
  verres_correcteurs: "art. 124",
  hospitalisation: "art. 125",
  evacuation_sanitaire: "art. 126",
};

/** Un séjour a une durée ; des soins ponctuels n'en ont pas. */
export function priseEnChargeAvecSejour(type?: TypePriseEnCharge | null): boolean {
  return type === "hospitalisation" || type === "evacuation_sanitaire";
}

export const TYPE_PIECE_SANTE_LABEL: Record<TypePieceSante, string> = {
  facture: "Facture",
  ordonnance: "Ordonnance",
  certificat: "Certificat médical",
  rapport_medical: "Rapport médical",
  autre: "Autre",
};

export const TYPE_VISITE_LABEL: Record<TypeVisiteMedicale, string> = {
  embauche: "Visite d'embauche",
  annuelle: "Visite annuelle",
  consultation: "Consultation",
};

export const TYPE_STRUCTURE_SANITAIRE_LABEL: Record<TypeStructureSanitaire, string> = {
  medecin: "Médecin agréé",
  formation_sanitaire: "Formation sanitaire",
  opticien: "Opticien agréé",
  pharmacie: "Pharmacie",
};

/**
 * Montant en francs CFA, ou `—` si l'API n'en a pas encore.
 *
 * Réexport de `formatFCFA` : les prestations et la vue d'ensemble affichent les
 * mêmes montants, ils doivent s'écrire pareil. Une seconde implémentation
 * finirait par diverger d'un séparateur.
 */
export { formatFCFA as formatMontant } from "~/constants/reporting";
