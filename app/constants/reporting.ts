import type { BadgeColor } from "~/constants/carriere";
import type { AlerteReporting } from "~/schemas/reporting";

export type { BadgeColor } from "~/constants/carriere";

/**
 * Palette de visualisation.
 *
 * Bleu ARTF pour tout ce qui est **une seule mesure** (un effectif, un nombre de
 * jours) : une grandeur se lit avec une seule couleur, la teinte n'a rien à
 * distinguer. Les deux teintes catégorielles ne servent qu'au genre, seul
 * graphique à comparer des identités — elles ont été validées pour rester
 * distinguables en vision daltonienne (ΔE 19,7 protan, 28,9 en vision normale).
 *
 * L'application est en mode clair uniquement (cf. `nuxt.config.ts`) : une seule
 * déclinaison suffit.
 */
export const VIZ = {
  /** Mesure unique — bleu de marque. */
  serie: "#0f4c81",
  /** Fond de barre et piste de jauge — même teinte, éclaircie. */
  piste: "#d5e3f1",
  /** Catégoriel, réservé au genre. */
  categoriel: ["#4480bb", "#eb6834"],
  /** Absence de donnée : gris neutre, jamais une teinte de série. */
  neutre: "#c3c2b7",
} as const;

/**
 * Couleurs d'état, réservées aux alertes de conformité. Elles ne servent jamais
 * de couleur de série, et ne portent jamais seules le sens : un libellé et une
 * icône les accompagnent toujours.
 */
export const VIZ_ETAT = {
  bon: "#0ca30c",
  attention: "#fab219",
  serieux: "#ec835a",
  critique: "#d03b3b",
} as const;

/** Axes de répartition, dans l'ordre d'affichage voulu à l'écran. */
export const AXES_REPARTITION = [
  "direction",
  "grade",
  "fonction",
  "type_integration",
  "age",
  "genre",
] as const;

export type AxeRepartitionAffiche = (typeof AXES_REPARTITION)[number];

/** Titre de carte par axe — plus parlant que le libellé technique de l'API. */
export const AXE_TITRE: Record<AxeRepartitionAffiche, string> = {
  direction: "Effectif par direction",
  grade: "Effectif par grade",
  fonction: "Effectif par fonction",
  type_integration: "Effectif par type d'intégration",
  age: "Répartition par âge",
  genre: "Répartition par genre",
};

/**
 * Une phrase qui dit **ce que compte** le graphique. Le tableau de bord est lu
 * par des gens qui ne connaissent pas le modèle de données : sans cette ligne,
 * un chiffre n'est qu'un chiffre.
 */
export const AXE_EXPLICATION: Record<AxeRepartitionAffiche, string> = {
  direction: "Agents présents rattachés à chaque direction, d'après leur affectation active.",
  grade: "Agents présents par grade de la grille salariale.",
  fonction: "Agents présents par fonction occupée.",
  type_integration: "Comment les agents présents sont entrés à l'ARTF : recrutement, stage, consultance…",
  age: "Âge des agents présents, par tranche.",
  genre: "Part des femmes et des hommes parmi les agents présents.",
};

/** Ce que veut dire « effectif présent » — définition posée par l'API. */
export const DEFINITION_EFFECTIF_PRESENT =
  "Agents actifs, stagiaires et suspendus. Les agents archivés, retraités, détachés ou en disponibilité n'y figurent pas.";

/**
 * Gravité d'une alerte de conformité.
 *
 * `critique` = une obligation réglementaire n'est pas remplie (affiliation CNSS
 * art. 47, contrat au-delà du délai) ; `attention` = un manque qui gêne le
 * fonctionnement sans être une infraction (dossier incomplet, poste vacant).
 */
export const GRAVITE_ALERTE: Record<string, "critique" | "serieux" | "attention"> = {
  sans_affiliation_cnss: "critique",
  contrat_echeance_30: "critique",
  contrat_echeance_60: "serieux",
  sans_n1: "serieux",
  dossier_incomplet: "attention",
  poste_vacant: "attention",
};

/** Pourquoi cette alerte compte, et ce qu'il faut faire. */
export const CONSEIL_ALERTE: Record<string, string> = {
  sans_affiliation_cnss: "L'affiliation à la CNSS est obligatoire pour un agent en poste (art. 47).",
  contrat_echeance_30: "Ces contrats arrivent à terme dans moins de 30 jours : renouveler ou clôturer.",
  contrat_echeance_60: "Ces contrats arrivent à terme dans moins de 60 jours (les 30 jours compris).",
  sans_n1: "Sans supérieur identifié, l'agent ne peut être ni noté ni validé : corriger son affectation.",
  dossier_incomplet: "Informations personnelles, professionnelles ou contact d'urgence manquants.",
  poste_vacant: "Postes de responsabilité sans titulaire : à pourvoir par nomination.",
};

/** Écran vers lequel envoyer pour traiter l'alerte. */
export const LIEN_ALERTE: Record<string, string> = {
  sans_affiliation_cnss: "/affaires-sociales/affiliations",
  contrat_echeance_30: "/carriere/contrats",
  contrat_echeance_60: "/carriere/contrats",
  sans_n1: "/carriere/affectations",
  dossier_incomplet: "/personnel/agents",
  poste_vacant: "/carriere/postes-vacants",
};

export interface AlerteAffichee extends AlerteReporting {
  gravite: "critique" | "serieux" | "attention";
  conseil?: string;
  lien?: string;
  couleur: string;
  icone: string;
  badge: BadgeColor;
}

const ICONE_GRAVITE = {
  critique: "i-lucide-octagon-alert",
  serieux: "i-lucide-triangle-alert",
  attention: "i-lucide-info",
} as const;

const BADGE_GRAVITE: Record<"critique" | "serieux" | "attention", BadgeColor> = {
  critique: "error",
  serieux: "warning",
  attention: "neutral",
};

/**
 * Alertes prêtes à rendre : les non nulles seulement, triées par gravité puis
 * par volume. Une alerte à zéro n'est pas une information — elle ferait du bruit
 * au milieu de celles qui demandent une action.
 */
export function alertesAffichees(alertes: AlerteReporting[]): AlerteAffichee[] {
  const ordre = { critique: 0, serieux: 1, attention: 2 } as const;

  return alertes
    .filter((a) => a.total > 0)
    .map((a) => {
      const gravite = GRAVITE_ALERTE[a.code] ?? "attention";
      return {
        ...a,
        gravite,
        conseil: CONSEIL_ALERTE[a.code],
        lien: LIEN_ALERTE[a.code],
        couleur: gravite === "critique" ? VIZ_ETAT.critique : gravite === "serieux" ? VIZ_ETAT.serieux : VIZ_ETAT.attention,
        icone: ICONE_GRAVITE[gravite],
        badge: BADGE_GRAVITE[gravite],
      };
    })
    .sort((a, b) => ordre[a.gravite] - ordre[b.gravite] || b.total - a.total);
}

/** Montant en francs CFA, format français. */
export function formatFCFA(montant?: number | null): string {
  if (montant == null) return "—";
  return `${montant.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} F`;
}

/**
 * Compacte un grand nombre pour une tuile (1 284 → 1 284 ; 84 500 000 → 84,5 M).
 * Au-delà du million, le détail exact n'apporte rien à un coup d'œil.
 */
export function formatCompact(valeur?: number | null): string {
  if (valeur == null) return "—";
  if (Math.abs(valeur) >= 1_000_000) {
    return `${(valeur / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M`;
  }
  return valeur.toLocaleString("fr-FR");
}
