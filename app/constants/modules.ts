import type { NavigationMenuItem } from "@nuxt/ui";

/**
 * Source unique des **modules** de l'application (portail à modules).
 *
 * Un module = une carte de la grille d'accueil + sa navigation cloisonnée
 * (sidebar contextuelle) + sa règle d'accès (`gate`). C'est le seul endroit qui
 * décrit « qui voit quoi » : le hub, la sidebar et le garde de route s'appuient
 * tous dessus via les helpers purs ci-dessous.
 *
 * Les permissions/rôles référencés suivent le backend
 * (`database/seeders/{Permission,Role}Seeder.php`).
 */

/** Règle de visibilité : le module est visible si l'UNE des conditions est vraie. */
export interface ModuleGate {
  anyPermission?: string[];
  anyRole?: string[];
  /**
   * Conditions **dérivées des données** de la session, hors permissions/rôles.
   * Seule portée aujourd'hui : `"entite"` = l'utilisateur dirige une structure
   * (cf. `useMonEntite`). Utilisé pour les sous-onglets, pas pour les modules.
   */
  anyScope?: string[];
}

export interface AppModule {
  /** Identifiant stable (clé de rendu, résolution). */
  key: string;
  label: string;
  /** Sous-texte de la carte du hub. */
  description: string;
  icon: string;
  /** Route d'atterrissage à l'entrée du module. */
  to: string;
  /** Préfixes de route rattachés au module (résolution du module actif). */
  match: string[];
  /** Absent = accessible à tout utilisateur authentifié. */
  gate?: ModuleGate;
  /** Menu propre au module, rendu dans la page quand il est actif. */
  nav: NavigationMenuItem[][];
  /**
   * Règles de visibilité **par sous-onglet** (clé = destination `to`). Une
   * entrée sans règle est toujours visible. Permet un module ouvert à tous
   * dont certains onglets sont réservés (ex. « Vue d'ensemble RH »).
   */
  navGates?: Record<string, ModuleGate>;
}

/** Contexte d'accès minimal — découplé de Pinia pour rester testable. */
export interface AccessContext {
  can: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  /** Portées dérivées des données (cf. `ModuleGate.anyScope`). Absent = aucune. */
  hasScope?: (scope: string) => boolean;
}

export const modules: AppModule[] = [
  {
    // Module d'accueil, ouvert à **tout** utilisateur authentifié : il fusionne
    // l'ancien « Mon espace » et l'ancien « Tableau de bord ». Ses onglets sont
    // cumulatifs — chacun n'a que ce que son compte justifie :
    //   Mon espace (toujours) → Mon entité (si on dirige une structure)
    //   → Vue d'ensemble RH (si permission de reporting).
    // `/profil` appartient au module (résolution de route) mais n'est PAS un
    // onglet : il est déjà joignable depuis le menu utilisateur et depuis la
    // carte « Mon profil » de l'espace — un troisième chemin ferait doublon.
    key: "tableau-de-bord",
    label: "Tableau de bord",
    description: "Votre espace, votre entité et la vue d'ensemble RH.",
    icon: "i-lucide-gauge",
    to: "/mon-espace",
    match: ["/mon-espace", "/mon-entite", "/tableau-de-bord", "/profil"],
    nav: [
      [
        { label: "Mon espace", icon: "i-lucide-user-round", to: "/mon-espace" },
        { label: "Mon entité", icon: "i-lucide-building-2", to: "/mon-entite" },
        { label: "Vue d'ensemble RH", icon: "i-lucide-gauge", to: "/tableau-de-bord" },
      ],
    ],
    navGates: {
      "/mon-entite": { anyScope: ["entite"] },
      "/tableau-de-bord": { anyPermission: ["consulter-reporting", "consulter-agents"] },
    },
  },
  {
    key: "personnel",
    label: "Personnel",
    description: "Agents et stagiaires de l'ARTF.",
    icon: "i-lucide-users",
    to: "/personnel/agents",
    match: ["/personnel"],
    gate: { anyPermission: ["consulter-agents"] },
    nav: [
      [
        { label: "Agents", icon: "i-lucide-user-check", to: "/personnel/agents" },
        { label: "Stagiaires", icon: "i-lucide-graduation-cap", to: "/personnel/stagiaires" },
      ],
    ],
  },
  {
    key: "integration",
    label: "Intégration",
    description: "Dossiers d'intégration et validations.",
    icon: "i-lucide-user-plus",
    to: "/integration/dossiers",
    match: ["/integration"],
    gate: { anyPermission: ["consulter-recrutement"] },
    nav: [
      [
        { label: "Dossiers", icon: "i-lucide-folder-open", to: "/integration/dossiers" },
        { label: "Nouvelle intégration", icon: "i-lucide-file-plus", to: "/integration/nouveau" },
        { label: "Mes validations", icon: "i-lucide-check-check", to: "/integration/validations" },
      ],
    ],
  },
  {
    key: "carriere",
    label: "Carrière",
    description: "Affectations, nominations et vie administrative des agents.",
    icon: "i-lucide-briefcase",
    to: "/carriere/affectations",
    match: ["/carriere"],
    // Actes RH (affectations/nominations/contrats/salaires) → réservé au métier
    // RH + admin. La hiérarchie consulte la carrière depuis la fiche agent.
    gate: { anyPermission: ["gerer-nominations", "consulter-recrutement"] },
    nav: [
      [
        { label: "Affectations", icon: "i-lucide-map-pin", to: "/carriere/affectations" },
        { label: "Nominations", icon: "i-lucide-award", to: "/carriere/nominations" },
        { label: "Postes vacants", icon: "i-lucide-user-search", to: "/carriere/postes-vacants" },
      ],
    ],
  },
  {
    key: "conges",
    label: "Congés & Absences",
    description: "Demandes de congé, soldes et absences des agents.",
    icon: "i-lucide-calendar-days",
    to: "/conges/demandes",
    match: ["/conges", "/absences"],
    // Ouvert à qui consulte les congés OU les absences. Le CTA de création et les
    // boutons de validation se jouent en plus sur les permissions/rôles (§2c).
    gate: { anyPermission: ["consulter-conges", "consulter-absences"] },
    nav: [
      [
        { label: "Demandes", icon: "i-lucide-file-text", to: "/conges/demandes" },
        { label: "Soldes", icon: "i-lucide-wallet", to: "/conges/soldes" },
        { label: "Absences", icon: "i-lucide-user-x", to: "/conges/absences" },
        { label: "Paramétrage", icon: "i-lucide-sliders-horizontal", to: "/conges/parametrage" },
      ],
    ],
    navGates: {
      "/conges/demandes": { anyPermission: ["consulter-conges"] },
      "/conges/soldes": { anyPermission: ["consulter-conges"] },
      "/conges/absences": { anyPermission: ["consulter-absences"] },
      "/conges/parametrage": { anyPermission: ["valider-conges"] },
    },
  },
  {
    key: "remuneration",
    label: "Rémunération",
    description: "Grille salariale et salaires des agents.",
    icon: "i-lucide-banknote",
    to: "/remuneration/grille",
    match: ["/remuneration"],
    gate: { anyPermission: ["consulter-salaires"] },
    nav: [
      [
        { label: "Grille salariale", icon: "i-lucide-table-2", to: "/remuneration/grille" },
        { label: "Salaires agents", icon: "i-lucide-wallet", to: "/remuneration/salaires" },
      ],
    ],
  },
  {
    key: "administration",
    label: "Administration",
    description: "Structure organisationnelle et référentiels métier.",
    icon: "i-lucide-settings",
    to: "/structure/administrations",
    match: ["/structure", "/referentiels"],
    // NB : `consulter-referentiels` est accordé largement (même à l'agent, pour
    // les listes déroulantes) → on gate sur des permissions réellement
    // « administration » pour ne pas exposer ce module à un agent simple.
    gate: { anyPermission: ["consulter-structure", "consulter-utilisateurs"] },
    nav: [
      [
        {
          label: "Structure",
          icon: "i-lucide-building-2",
          defaultOpen: true,
          children: [
            { label: "Localités", to: "/structure/localites" },
            { label: "Administrations", to: "/structure/administrations" },
            { label: "Directions", to: "/structure/directions" },
            { label: "Services", to: "/structure/services" },
            { label: "Bureaux", to: "/structure/bureaux" },
          ],
        },
        {
          label: "Référentiels",
          icon: "i-lucide-list",
          children: [
            { label: "Grades", to: "/referentiels/grades" },
            { label: "Catégories", to: "/referentiels/categories" },
            { label: "Échelons", to: "/referentiels/echelons" },
            { label: "Fonctions", to: "/referentiels/fonctions" },
            { label: "Diplômes", to: "/referentiels/diplomes" },
            { label: "Types de contrat", to: "/referentiels/types-contrats" },
            { label: "Types de document", to: "/referentiels/types-documents" },
            { label: "Types d'intégration", to: "/referentiels/types-integrations" },
            { label: "Types d'absence", to: "/referentiels/types-absences" },
            { label: "Types de congé", to: "/referentiels/types-conges" },
            { label: "Motifs administratifs", to: "/referentiels/motifs-administratifs" },
          ],
        },
      ],
    ],
  },
];

/** Une règle est-elle satisfaite ? (l'UNE des conditions suffit). */
export function satisfiesGate(gate: ModuleGate | undefined, ctx: AccessContext): boolean {
  if (!gate) return true;
  const byPermission = gate.anyPermission?.some((p) => ctx.can(p)) ?? false;
  const byRole = gate.anyRole?.some((r) => ctx.hasRole(r)) ?? false;
  const byScope = gate.anyScope?.some((s) => ctx.hasScope?.(s) ?? false) ?? false;
  return byPermission || byRole || byScope;
}

/** Le module est-il visible pour ce contexte ? (pas de `gate` = toujours). */
export function canAccessModule(m: AppModule, ctx: AccessContext): boolean {
  return satisfiesGate(m.gate, ctx);
}

/**
 * Sous-menu du module filtré par `navGates` : on retire les entrées (et les
 * enfants) dont la règle n'est pas satisfaite, puis les groupes devenus vides.
 */
export function visibleNav(m: AppModule, ctx: AccessContext): NavigationMenuItem[][] {
  const allowed = (item: NavigationMenuItem): boolean =>
    satisfiesGate(typeof item.to === "string" ? m.navGates?.[item.to] : undefined, ctx);

  return m.nav
    .map((group) =>
      group
        .filter(allowed)
        .map((item) =>
          item.children?.length ? { ...item, children: item.children.filter(allowed) } : item,
        )
        .filter((item) => !item.children || item.children.length > 0),
    )
    .filter((group) => group.length > 0);
}

/** Modules visibles, dans l'ordre déclaré. */
export function accessibleModules(ctx: AccessContext): AppModule[] {
  return modules.filter((m) => canAccessModule(m, ctx));
}

/** Module auquel appartient une route (préfixe le plus long d'abord). */
export function moduleForPath(path: string): AppModule | undefined {
  let best: { module: AppModule; length: number } | undefined;
  for (const m of modules) {
    for (const prefix of m.match) {
      const isMatch = path === prefix || path.startsWith(`${prefix}/`);
      if (isMatch && (!best || prefix.length > best.length)) {
        best = { module: m, length: prefix.length };
      }
    }
  }
  return best?.module;
}

/**
 * Route d'atterrissage après connexion : le premier module accessible. Le
 * module d'accueil n'ayant pas de `gate`, tout le monde atterrit sur son
 * espace ; les modules métier restent à un onglet de distance.
 */
export function landingRoute(ctx: AccessContext): string {
  return accessibleModules(ctx)[0]?.to ?? "/mon-espace";
}
