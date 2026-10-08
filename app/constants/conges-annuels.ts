import type {
  ORIGINES_CONGE_ANNUEL,
  STATUTS_CAMPAGNE_CONGE_ANNUEL,
  STATUTS_REPORT_CONGE_ANNUEL,
} from "~/constants/enums";
import type { BadgeColor } from "~/constants/carriere";
import type { DemandeConge } from "~/schemas/demande-conge";
import type { CampagneCongeAnnuel } from "~/schemas/conge-annuel";

/**
 * Règles d'écran du congé annuel (`/conges-annuels`, note FE §2c). Pures et
 * testées : les pages n'en font que l'affichage.
 */

export type OrigineCongeAnnuel = (typeof ORIGINES_CONGE_ANNUEL)[number];
export type StatutCampagne = (typeof STATUTS_CAMPAGNE_CONGE_ANNUEL)[number];
export type StatutReport = (typeof STATUTS_REPORT_CONGE_ANNUEL)[number];

export const STATUT_CAMPAGNE_COLOR: Record<StatutCampagne, BadgeColor> = {
  brouillon: "neutral",
  ouverte: "success",
  cloturee: "primary",
};

/** Libellé de repli si l'API ne fournit pas `statut_label`. */
export const STATUT_CAMPAGNE_LABEL: Record<StatutCampagne, string> = {
  brouillon: "Brouillon",
  ouverte: "Ouverte",
  cloturee: "Clôturée",
};

export const STATUT_REPORT_COLOR: Record<StatutReport, BadgeColor> = {
  propose: "warning",
  accorde: "success",
  refuse: "error",
};

export const STATUT_REPORT_LABEL: Record<StatutReport, string> = {
  propose: "Proposé",
  accorde: "Accordé",
  refuse: "Refusé",
};

export const ORIGINE_LABEL: Record<OrigineCongeAnnuel, string> = {
  campagne: "Campagne",
  apres_cloture: "Droit acquis après clôture",
};

/** Plafond du report pour nécessité de service (jours ouvrables). */
export const PLAFOND_REPORT_JOURS = 60;

/**
 * Type « Congé annuel » ? Miroir de `CongeAnnuelDemandeService::estCongeAnnuel`
 * (préfixe du nom, insensible à la casse). Sert à le retirer du formulaire
 * générique : il ne se saisit plus via `POST /conges/demandes`.
 */
export function estTypeCongeAnnuel(type: { nom?: string | null } | null | undefined): boolean {
  return (type?.nom ?? "").trim().toLowerCase().startsWith("congé annuel");
}

/** La demande relève-t-elle du circuit `/conges-annuels` ? (`origine` posée). */
export function estCircuitAnnuel(d: Pick<DemandeConge, "origine">): boolean {
  return d.origine != null;
}

/**
 * Gestion de la campagne et décision des reports : rôle `rh` ou `admin`
 * **exactement** (`assertRh()` côté API). Les rôles de bureau DRHL
 * (`rh-personnel`…) et les chefs reçoivent 403 : ne pas élargir à `estRh()`.
 */
export function gereCongeAnnuel(hasRole: (role: string) => boolean): boolean {
  return hasRole("rh") || hasRole("admin");
}

/** Campagne de l'année donnée, s'il y en a une (une seule par année). */
export function campagneDeLAnnee(
  campagnes: readonly CampagneCongeAnnuel[],
  annee: number,
): CampagneCongeAnnuel | null {
  return campagnes.find((c) => c.annee === annee) ?? null;
}

/**
 * Formulaire de dépôt à proposer à l'agent selon l'état de la campagne :
 * - `ouverte` → proposition de campagne ;
 * - `cloturee` → droit acquis après clôture (l'API tranche l'éligibilité : 422
 *   si l'agent avait déjà 12 mois à la clôture) ;
 * - pas de campagne / brouillon → rien.
 */
export function origineDepot(campagne: Pick<CampagneCongeAnnuel, "statut"> | null): OrigineCongeAnnuel | null {
  if (campagne?.statut === "ouverte") return "campagne";
  if (campagne?.statut === "cloturee") return "apres_cloture";
  return null;
}

/**
 * Le traitement N+1 / RH est-il ouvert ? Une proposition de campagne attend la
 * clôture (422 avant) ; le droit après clôture se traite tout de suite.
 */
export function traitementOuvert(
  d: Pick<DemandeConge, "origine">,
  campagne: Pick<CampagneCongeAnnuel, "statut"> | null,
): boolean {
  if (d.origine !== "campagne") return true;
  return campagne?.statut === "cloturee";
}

/**
 * Le connecté peut-il annuler ce congé annuel ? `soumise`, demandeur (ou
 * `admin`), et pour une proposition de campagne : campagne encore `ouverte`.
 */
export function peutAnnulerCongeAnnuel(
  d: Pick<DemandeConge, "statut" | "agent_id" | "origine">,
  campagne: Pick<CampagneCongeAnnuel, "statut"> | null,
  user: { agent_id?: number | null; estAdmin: boolean },
): boolean {
  if (d.statut !== "soumise") return false;
  if (!user.estAdmin && (user.agent_id == null || user.agent_id !== d.agent_id)) return false;
  if (d.origine === "campagne") return campagne?.statut === "ouverte";
  return true;
}

/**
 * Samedi ou dimanche ? Contrôle de confort avant envoi : le départ doit être un
 * jour ouvrable. Les jours fériés restent tranchés par l'API (422).
 */
export function estWeekEnd(date: string | null | undefined): boolean {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [y, m, d] = date.split("-").map(Number);
  const jour = new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay();
  return jour === 0 || jour === 6;
}

/** Libellé « Type » d'une ligne de demande : le circuit annuel est précisé. */
export function libelleTypeDemande(
  d: Pick<DemandeConge, "origine" | "origine_label"> & { type_conge?: { nom?: string | null } | null },
): string {
  const nom = d.type_conge?.nom ?? "—";
  if (!d.origine) return nom;
  return `${nom} · ${d.origine_label ?? ORIGINE_LABEL[d.origine]}`;
}
