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

// ── Pastilles d'attention ────────────────────────────────────────────────────

/**
 * Deux natures de signal, et il ne faut surtout pas les confondre :
 *
 * - **`action`** — quelque chose est bloqué **sur vous** : une fiche à signer,
 *   un dossier incomplet. C'est vous qui tenez la file.
 * - **`info`** — il s'est passé quelque chose que vous n'avez pas encore lu.
 *   Aucune action attendue.
 *
 * Les peindre pareil rendrait le premier invisible : au bout d'une semaine,
 * l'utilisateur ne regarde plus une pastille qui ne veut jamais rien dire.
 */
export type TonAlerte = "action" | "info";

export interface AlerteCarte {
  ton: TonAlerte;
  /** Ce que la pastille affiche. `0` = pastille sans chiffre. */
  compte: number;
  /** Phrase d'infobulle : ce qu'il faut comprendre, pas le nom du signal. */
  libelle: string;
}

/**
 * Domaines de notification rattachés à chaque carte (cf. `constants/notifications`).
 * Une carte sans entrée ne porte jamais de pastille « info ».
 */
export const DOMAINES_PAR_CARTE: Record<string, string[]> = {
  profil: ["compte"],
  carriere: ["affectation", "nomination", "lot_affectation", "lot_nomination", "prise_de_service", "stage"],
  conges: ["conge"],
  absences: ["absence"],
  evaluations: ["evaluation"],
  discipline: ["discipline"],
  dossier: ["integration"],
};

export interface SignauxMonEspace {
  /** Notifications **non lues**, par domaine. */
  nonLuesParDomaine: Record<string, number>;
  /** Fiches d'évaluation attendant la signature de l'agent. */
  fichesASigner: number;
  /** Sections manquantes du dossier (libellés prêts à afficher). */
  sectionsManquantes: string[];
}

/**
 * Pastille de chaque carte, à partir des signaux collectés.
 *
 * Une carte ne porte **qu'une** pastille : deux se disputeraient le même coup
 * d'œil. En cas de concurrence, l'action l'emporte sur l'information — ce qui
 * vous attend passe avant ce qui s'est passé.
 */
export function alertesParCarte(signaux: SignauxMonEspace): Record<string, AlerteCarte> {
  const alertes: Record<string, AlerteCarte> = {};

  // 1. Informations : ce qui est arrivé et n'a pas été lu.
  for (const [carte, domaines] of Object.entries(DOMAINES_PAR_CARTE)) {
    const total = domaines.reduce((somme, d) => somme + (signaux.nonLuesParDomaine[d] ?? 0), 0);
    if (total > 0) {
      alertes[carte] = {
        ton: "info",
        compte: total,
        libelle: `${total} notification${total > 1 ? "s" : ""} non lue${total > 1 ? "s" : ""}`,
      };
    }
  }

  // 2. Actions : elles écrasent l'information si elles portent sur la même carte.
  if (signaux.fichesASigner > 0) {
    const n = signaux.fichesASigner;
    alertes.evaluations = {
      ton: "action",
      compte: n,
      libelle: `${n} fiche${n > 1 ? "s" : ""} attend${n > 1 ? "ent" : ""} votre signature`,
    };
  }

  if (signaux.sectionsManquantes.length) {
    alertes.dossier = {
      ton: "action",
      // Pas de chiffre : « 2 » sur un dossier se lirait comme deux documents
      // reçus, pas comme deux rubriques à remplir.
      compte: 0,
      libelle: `À compléter : ${signaux.sectionsManquantes.join(", ")}.`,
    };
  }

  return alertes;
}
