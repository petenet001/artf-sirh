import type { Evaluation } from "~/schemas/evaluation";
import type { AvisHierarchique, NiveauRequis } from "~/schemas/avis-hierarchique";
import type { BadgeColor, NiveauAvisHierarchique, StatutEvaluation } from "~/constants/evaluations";
import { NIVEAU_AVIS_ROLE, STATUTS_FICHE_PDF } from "~/constants/evaluations";

/**
 * Qui agit sur une fiche d'évaluation.
 *
 * Le backend ne contrôle que la **permission de route** (`consulter-` /
 * `valider-` / `creer-evaluations`) : il ne vérifie pas que le signataire est
 * bien le notateur ou l'agent de la fiche (point remonté côté API). C'est donc
 * le front qui compose permission **et** identité pour ne proposer que les
 * actions légitimes — masquer un bouton n'est pas une sécurité, mais c'est la
 * seule façon de ne pas envoyer l'utilisateur dans le mur.
 *
 * ⚠️ `valider-evaluations` est détenu par **tous les chefs** (seeder) : ne
 * jamais s'en servir seul pour ouvrir un écran RH — combiner avec le rôle.
 */
export interface ActeurEvaluation {
  /** Agent rattaché au compte connecté (`user.agent_id`), s'il existe. */
  agentId?: number | null;
  /** Rôle `rh` ou `admin` : le métier RH de l'évaluation (art. 66–70). */
  estRh: boolean;
  /** Permission `valider-evaluations` (noter, signer, valider). */
  peutValider: boolean;
  /** Permission `creer-evaluations` (sessions, grille, réattribution). */
  peutCreer?: boolean;
  /** Rôle `directeur-general` — accès au PDF de toute fiche, décide en commission. */
  estDg?: boolean;
  /** Rôle `admin` — passe-partout, y compris sur la chaîne d'avis. */
  estAdmin?: boolean;
  /** Rôles bruts du compte, pour la chaîne d'avis hiérarchiques (art. 64). */
  roles?: string[];
}

/** Action proposée sur une fiche. `key` pilote le handler de la page. */
export interface ActionEvaluation {
  key:
    | "noter"
    | "avis_et_signer"
    | "signer_evalue"
    | "reclamer"
    | "envoyer_rh"
    | "valider_rh"
    | "rejeter_rh"
    | "traiter_reclamation"
    | "annuler"
    | "inscrire_tableau"
    | "retirer_tableau";
  label: string;
  icon: string;
  color: BadgeColor;
  /** Mise en avant : une seule action principale par fiche. */
  principale?: boolean;
}

/** Le connecté est-il le notateur (N+1) de cette fiche ? */
export function estNotateur(fiche: Pick<Evaluation, "superieur_id">, acteur: ActeurEvaluation): boolean {
  return acteur.agentId != null && acteur.agentId === fiche.superieur_id;
}

/** Le connecté est-il l'agent évalué ? */
export function estEvalue(fiche: Pick<Evaluation, "agent_id">, acteur: ActeurEvaluation): boolean {
  return acteur.agentId != null && acteur.agentId === fiche.agent_id;
}

/** Statuts depuis lesquels la RH peut encore annuler la fiche (enum PHP). */
const STATUTS_ANNULABLES: StatutEvaluation[] = ["en_attente", "en_cours", "notee", "en_validation_rh"];

/**
 * Actions ouvertes au connecté sur cette fiche, dans l'ordre d'affichage.
 *
 * On part de `prochaine_etape` (calculée par l'API depuis le statut seul), puis
 * on filtre par l'identité de l'acteur. Les étapes du tableau d'avancement
 * (`inscrire_tableau`, `commission_preparatoire`, `avancer_echelon`) ne
 * produisent pas de bouton ici : elles vivent dans l'écran Tableau &
 * commissions — seul leur libellé d'étape est affiché.
 */
export function actionsEvaluation(fiche: Evaluation, acteur: ActeurEvaluation): ActionEvaluation[] {
  const actions: ActionEvaluation[] = [];
  const notateur = estNotateur(fiche, acteur) && acteur.peutValider;
  const evalue = estEvalue(fiche, acteur);
  const rh = acteur.estRh && acteur.peutValider;

  switch (fiche.prochaine_etape) {
    case "noter":
      if (notateur) actions.push({ key: "noter", label: "Évaluer", icon: "i-lucide-pencil-line", color: "primary", principale: true });
      break;
    case "continuer_notation":
      if (notateur) actions.push({ key: "noter", label: "Continuer la notation", icon: "i-lucide-pencil-line", color: "primary", principale: true });
      break;
    case "corriger_notation":
      if (notateur) actions.push({ key: "noter", label: "Corriger la note", icon: "i-lucide-pencil-line", color: "warning", principale: true });
      break;
    case "avis_et_signer":
      if (notateur) actions.push({ key: "avis_et_signer", label: "Donner mon avis et signer", icon: "i-lucide-pen-tool", color: "primary", principale: true });
      break;
    case "signer_evalue":
      if (evalue) actions.push({ key: "signer_evalue", label: "Prendre connaissance et signer", icon: "i-lucide-pen-tool", color: "primary", principale: true });
      break;
    case "envoyer_rh":
      // Fiche signée par l'agent : il transmet, ou conteste (art. 65).
      if (evalue) {
        actions.push({ key: "envoyer_rh", label: "Transmettre à la RH", icon: "i-lucide-send", color: "primary", principale: true });
        actions.push({ key: "reclamer", label: "Contester ma note", icon: "i-lucide-message-square-warning", color: "warning" });
      }
      break;
    case "traiter_reclamation":
      if (rh) actions.push({ key: "traiter_reclamation", label: "Traiter la réclamation", icon: "i-lucide-scale", color: "warning", principale: true });
      break;
    case "valider_rh":
      if (rh) {
        actions.push({ key: "valider_rh", label: "Valider", icon: "i-lucide-check", color: "success", principale: true });
        actions.push({ key: "rejeter_rh", label: "Rejeter", icon: "i-lucide-x", color: "error" });
      }
      break;
    default:
      break;
  }

  if (rh && STATUTS_ANNULABLES.includes(fiche.statut)) {
    actions.push({ key: "annuler", label: "Annuler la fiche", icon: "i-lucide-ban", color: "neutral" });
  }

  return actions;
}

/**
 * Le PDF de la fiche est-il proposable ? Le backend le refuse (422) avant la
 * signature de l'agent, et (403) à un tiers : ni l'agent, ni son N+1, ni
 * RH / admin / DG.
 */
export function peutTelechargerFiche(fiche: Evaluation, acteur: ActeurEvaluation): boolean {
  if (!STATUTS_FICHE_PDF.includes(fiche.statut)) return false;
  return estEvalue(fiche, acteur) || estNotateur(fiche, acteur) || acteur.estRh || !!acteur.estDg;
}

/**
 * Le notateur peut-il encore saisir des notes ? La grille reste ouverte tant
 * que la fiche n'est pas signée par lui (`en_attente` → `notee`), et redevient
 * ouverte après un rejet RH ou une réclamation acceptée.
 */
export function grilleOuverte(fiche: Pick<Evaluation, "statut">): boolean {
  return ["en_attente", "en_cours", "notee", "rejetee"].includes(fiche.statut);
}

// ---------------------------------------------------------------------------
// Avis hiérarchiques (CCN art. 64)
// ---------------------------------------------------------------------------

/** État d'un maillon de la chaîne d'avis, prêt à rendre. */
export interface EtatNiveauAvis {
  niveau: NiveauAvisHierarchique;
  label: string;
  /** Rang dans la chaîne, 1-indexé (la chaîne saute `directeur` si rattaché DG). */
  ordre: number;
  avis?: AvisHierarchique;
  signe: boolean;
  /** Le niveau précédent a signé : ce maillon est ouvert. */
  deverrouille: boolean;
  /** Le connecté peut poser ou modifier cet avis (rôle du niveau, ou `admin`). */
  actionnable: boolean;
}

/**
 * Chaîne d'avis d'une fiche : les niveaux requis (calculés serveur depuis
 * l'affectation de l'agent), croisés avec les avis déjà posés et le rôle du
 * connecté.
 *
 * Deux règles de la CCN portées ici, que le backend ne contrôle pas :
 * **séquentialité** (le niveau N n'est ouvert que si N−1 a signé) et
 * **correspondance de rôle** (un chef de bureau ne signe pas pour le directeur).
 */
export function chaineAvis(
  niveaux: NiveauRequis[],
  avis: AvisHierarchique[],
  acteur: ActeurEvaluation,
): EtatNiveauAvis[] {
  const parNiveau = new Map(avis.map((a) => [a.niveau, a]));
  const roles = acteur.roles ?? [];
  let precedentSigne = true;

  return niveaux.map((n, index) => {
    const pose = parNiveau.get(n.niveau);
    const signe = !!pose?.signe;
    const deverrouille = precedentSigne;
    const bonRole = acteur.estAdmin === true || roles.includes(NIVEAU_AVIS_ROLE[n.niveau]);

    precedentSigne = signe;

    return {
      niveau: n.niveau,
      label: n.label,
      ordre: index + 1,
      avis: pose,
      signe,
      deverrouille,
      actionnable: deverrouille && !signe && bonRole && acteur.peutValider,
    };
  });
}

/**
 * Un avis requis manque-t-il à l'appel ? L'API refuse alors `envoyer-rh` (422) :
 * on l'annonce avant le clic plutôt qu'après.
 */
export function envoiRhBloque(niveaux: NiveauRequis[], avis: AvisHierarchique[]): boolean {
  if (!niveaux.length) return false;
  const signes = new Set(avis.filter((a) => a.signe).map((a) => a.niveau));
  return niveaux.some((n) => !signes.has(n.niveau));
}

// ---------------------------------------------------------------------------
// Tableau d'avancement et commissions (CCN art. 68–70)
// ---------------------------------------------------------------------------

/**
 * Inscription / retrait du tableau d'avancement (D5). Réservé à la RH, sur une
 * fiche finalisée. L'API refuse (422) une fois la commission d'avancement
 * clôturée ou une décision posée : on masque alors le bouton de retrait.
 */
export function actionsTableau(fiche: Evaluation, acteur: ActeurEvaluation): ActionEvaluation[] {
  if (fiche.statut !== "finalisee" || !acteur.estRh || !acteur.peutValider) return [];

  if (!fiche.inscrit_tableau) {
    return [{ key: "inscrire_tableau", label: "Inscrire au tableau", icon: "i-lucide-list-plus", color: "primary" }];
  }
  if (fiche.commission_decision) return [];

  return [{ key: "retirer_tableau", label: "Retirer du tableau", icon: "i-lucide-list-minus", color: "neutral" }];
}

/** L'échelon reste-t-il à appliquer ? (décision favorable, pas encore avancé). */
export function peutAvancerEchelon(fiche: Evaluation): boolean {
  return fiche.commission_decision === "favorable" && !fiche.echelon_avance;
}

/**
 * Le notateur de cette fiche peut-il être réattribué ? (note FE §7b)
 *
 * Deux conditions serveur, plus une d'identité :
 * - la **session doit être ouverte** — sur une session clôturée, les fiches
 *   sont figées ;
 * - la **fiche ne doit pas être terminée** : une fois finalisée, rejetée ou
 *   annulée, changer le notateur réécrirait qui a signé ;
 * - c'est un geste RH (`creer-evaluations`), pas un geste de chef : un
 *   supérieur ne se retire pas lui-même d'une fiche qui le gêne.
 *
 * Le besoin est réel : l'alerte de conformité « agents sans supérieur » du
 * tableau de bord n'avait aucune action pour la résoudre côté évaluation.
 */
export function peutReattribuerSuperieur(
  fiche: Pick<Evaluation, "statut"> & { session?: { statut?: string | null } | null },
  acteur: Pick<ActeurEvaluation, "peutCreer">,
): boolean {
  if (!acteur.peutCreer) return false;
  // Session absente du payload : on ne présume pas qu'elle est ouverte.
  if (fiche.session?.statut !== "ouverte") return false;
  return !FICHE_TERMINEE.includes(fiche.statut as (typeof FICHE_TERMINEE)[number]);
}

/** Statuts après lesquels une fiche ne bouge plus. */
const FICHE_TERMINEE = ["finalisee", "rejetee", "annulee"] as const;
