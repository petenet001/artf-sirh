/**
 * Espace personnel : les écrans qu'un compte a sur **son propre** dossier.
 *
 * Source unique de la grille de `mon-espace`, et surtout du raisonnement qui la
 * gouverne — deux conditions distinctes se cumulent :
 *
 * 1. un **agent rattaché** au compte (`user.agent_id`) : sans lui, il n'y a ni
 *    congés, ni carrière, ni dossier à montrer (l'API répond 403) ;
 * 2. la **permission de lecture** du domaine, quand il y en a une.
 *
 * Certains domaines restent hors de cet espace faute de route personnelle :
 * bulletins de paie et formations sont indexés par agent mais gardés par
 * `consulter-salaires` / `consulter-formations`, que l'agent n'a pas.
 */
export interface CartePersonnelle {
  key: string;
  label: string;
  description: string;
  icon: string;
  to: string;
  /** Exige un agent rattaché au compte. */
  exigeAgent?: boolean;
  /** Permission de lecture du domaine, si le domaine en a une. */
  permission?: string;
}

export const CARTES_MON_ESPACE: CartePersonnelle[] = [
  {
    key: "profil",
    label: "Mon profil",
    description: "Vos informations, rôles et permissions.",
    icon: "i-lucide-user",
    to: "/profil",
  },
  {
    key: "dossier",
    label: "Mon dossier",
    description: "Coordonnées, situation familiale, contacts d'urgence et documents.",
    icon: "i-lucide-folder-open",
    to: "/mon-espace/dossier",
    exigeAgent: true,
  },
  {
    key: "carriere",
    label: "Ma carrière",
    description: "Affectation, nomination, contrats et historique.",
    icon: "i-lucide-briefcase",
    to: "/mon-espace/carriere",
    exigeAgent: true,
  },
  {
    key: "conges",
    label: "Mes congés",
    description: "Vos soldes et vos demandes — et en déposer une.",
    icon: "i-lucide-calendar-check",
    to: "/mon-espace/conges",
    exigeAgent: true,
    permission: "consulter-conges",
  },
  {
    key: "absences",
    label: "Mes absences",
    description: "Vos absences, et la déclaration des vôtres.",
    icon: "i-lucide-calendar-x",
    to: "/mon-espace/absences",
    exigeAgent: true,
    permission: "consulter-absences",
  },
  {
    key: "evaluations",
    label: "Mes évaluations",
    description: "Vos fiches de notation : signature, réclamation, transmission RH.",
    icon: "i-lucide-clipboard-check",
    to: "/evaluations/mes-evaluations",
    permission: "consulter-evaluations",
  },
  {
    key: "discipline",
    label: "Mon dossier disciplinaire",
    description: "Sanctions et avertissements vous concernant.",
    icon: "i-lucide-shield-alert",
    to: "/mon-espace/discipline",
    exigeAgent: true,
  },
];

/** Cartes réellement ouvertes à ce compte, dans l'ordre déclaré. */
export function cartesVisibles(ctx: {
  estAgent: boolean;
  can: (permission: string) => boolean;
}): CartePersonnelle[] {
  return CARTES_MON_ESPACE.filter(
    (c) => (!c.exigeAgent || ctx.estAgent) && (!c.permission || ctx.can(c.permission)),
  );
}
