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
      // `consulter-reporting` **seul** : la page n'appelle que `/reporting/*`.
      // `consulter-agents` y figurait, ce qui ouvrait la vue d'ensemble à tous
      // les chefs — qui n'ont pas la permission de reporting et n'y auraient
      // récolté que des 403. La recette FE §2k.8 le dit : un directeur ne voit
      // pas le reporting.
      "/tableau-de-bord": { anyPermission: ["consulter-reporting"] },
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
        { label: "Conventions de stage", icon: "i-lucide-file-badge", to: "/personnel/stages" },
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
    // Actes RH (affectations/nominations/contrats) → métier RH + admin. Le
    // module s'ouvre en plus à `consulter-salaires` pour les reclassements
    // (art. 73–75), que le DG approuve : `navGates` lui réserve ce seul onglet.
    gate: { anyPermission: ["gerer-nominations", "consulter-recrutement", "consulter-salaires"] },
    nav: [
      [
        { label: "Affectations", icon: "i-lucide-map-pin", to: "/carriere/affectations" },
        { label: "Nominations", icon: "i-lucide-award", to: "/carriere/nominations" },
        { label: "Postes vacants", icon: "i-lucide-user-search", to: "/carriere/postes-vacants" },
        { label: "Reclassements", icon: "i-lucide-arrow-up-narrow-wide", to: "/carriere/reclassements" },
        { label: "Positions", icon: "i-lucide-user-cog", to: "/carriere/positions" },
        { label: "Contrats", icon: "i-lucide-file-signature", to: "/carriere/contrats" },
      ],
    ],
    navGates: {
      "/carriere/affectations": { anyPermission: ["gerer-nominations", "consulter-recrutement"] },
      "/carriere/nominations": { anyPermission: ["gerer-nominations", "consulter-recrutement"] },
      "/carriere/postes-vacants": { anyPermission: ["gerer-nominations", "consulter-recrutement"] },
      // Reclassements et positions : le DG y siège au titre de `consulter-salaires`.
      "/carriere/reclassements": { anyPermission: ["consulter-salaires"] },
      "/carriere/positions": { anyPermission: ["consulter-salaires"] },
      "/carriere/contrats": { anyPermission: ["consulter-contrats"] },
    },
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
    key: "evaluations",
    label: "Évaluations",
    description: "Notation annuelle, avis hiérarchiques et avancement (CCN art. 62–70).",
    icon: "i-lucide-clipboard-check",
    // Atterrissage volontairement sur « Mes évaluations » : tout agent a
    // `consulter-evaluations`, l'écran le plus universel est donc le sien.
    to: "/evaluations/mes-evaluations",
    match: ["/evaluations"],
    gate: { anyPermission: ["consulter-evaluations"] },
    nav: [
      [
        { label: "Mes évaluations", icon: "i-lucide-user-round-check", to: "/evaluations/mes-evaluations" },
        { label: "À noter", icon: "i-lucide-pencil-line", to: "/evaluations/a-noter" },
        { label: "Sessions", icon: "i-lucide-calendar-range", to: "/evaluations/sessions" },
        { label: "Validation RH", icon: "i-lucide-shield-check", to: "/evaluations/validation-rh" },
        { label: "Tableau & commissions", icon: "i-lucide-gavel", to: "/evaluations/tableau" },
        { label: "Bonifications", icon: "i-lucide-rocket", to: "/evaluations/bonifications" },
        { label: "Grille de critères", icon: "i-lucide-list-checks", to: "/evaluations/criteres" },
      ],
    ],
    // ⚠️ `valider-evaluations` est détenu par **tous les chefs** (seeder) : il
    // ouvre la file de notation, jamais les écrans RH — ceux-là se gatent sur
    // `creer-evaluations`, propre à la DRHL.
    navGates: {
      "/evaluations/a-noter": { anyPermission: ["valider-evaluations"] },
      "/evaluations/sessions": { anyPermission: ["creer-evaluations"] },
      // `creer-evaluations` désigne exactement la DRHL (`rh` + `admin`) : c'est
      // la permission, et non le nom du rôle, qui décide — la note FE §2k
      // interdit explicitement de tester `role === "rh"` pour un écran.
      "/evaluations/validation-rh": { anyPermission: ["creer-evaluations"] },
      // Commissions : le DG y siège (art. 68–70) et propose les exceptionnels.
      // Aucune permission ne dit « RH ou DG » — la règle cumule donc les deux
      // conditions (une porte est ouverte si l'UNE est vraie).
      "/evaluations/tableau": {
        anyPermission: ["creer-evaluations"],
        anyRole: ["directeur-general"],
      },
      "/evaluations/bonifications": {
        anyPermission: ["creer-evaluations"],
        anyRole: ["directeur-general"],
      },
      "/evaluations/criteres": { anyPermission: ["creer-evaluations"] },
    },
  },
  {
    key: "discipline",
    label: "Discipline",
    description: "Rapports, instruction et sanctions (CCN art. 90–91).",
    icon: "i-lucide-shield-alert",
    to: "/discipline/dossiers",
    match: ["/discipline"],
    // Quatre permissions distinctes, une par rôle du circuit : les chefs
    // proposent, la RH instruit, le DG prononce. L'agent concerné n'en a
    // aucune : son self-service vit dans Mon espace, pas ici.
    gate: {
      anyPermission: [
        "consulter-discipline",
        "proposer-discipline",
        "prononcer-discipline",
        "gerer-discipline",
      ],
    },
    nav: [
      [
        { label: "Dossiers", icon: "i-lucide-file-warning", to: "/discipline/dossiers" },
        { label: "Avertissements", icon: "i-lucide-message-square-warning", to: "/discipline/avertissements" },
        { label: "Types de sanction", icon: "i-lucide-list", to: "/discipline/types-sanctions" },
      ],
    ],
    navGates: {
      "/discipline/avertissements": { anyPermission: ["consulter-discipline"] },
      // Lecture ouverte aux proposants : un chef doit voir les types pour rédiger son rapport.
      "/discipline/types-sanctions": { anyPermission: ["gerer-discipline", "proposer-discipline"] },
    },
  },
  {
    key: "affaires-sociales",
    label: "Affaires sociales",
    description: "Protection sociale, prestations CCN et santé au travail (art. 58–59, 119–135).",
    icon: "i-lucide-heart-handshake",
    to: "/affaires-sociales/affiliations",
    match: ["/affaires-sociales"],
    // P1 : pas de self-service agent, et les chefs n'ont pas le menu.
    // Miroir exact des routes `/affaires-sociales` : elles acceptent
    // `consulter-affaires-sociales` **ou** `decider-prestations` (le DG décide
    // sans gérer). Le bureau B.A.S. (`rh-affaires-sociales`) porte les deux
    // permissions de gestion, il entre donc par la première.
    gate: { anyPermission: ["consulter-affaires-sociales", "decider-prestations"] },
    nav: [
      [
        { label: "Affiliations", icon: "i-lucide-id-card", to: "/affaires-sociales/affiliations" },
        { label: "Ayants droit", icon: "i-lucide-users", to: "/affaires-sociales/ayants-droit" },
        { label: "Prestations", icon: "i-lucide-hand-coins", to: "/affaires-sociales/prestations" },
      ],
      // Santé au travail (D.3.5) : les trois écrans se lisent ensemble, on les
      // sépare du bloc « protection sociale » plutôt que d'allonger une liste.
      [
        { label: "Arrêts de santé", icon: "i-lucide-bed", to: "/affaires-sociales/arrets" },
        {
          label: "Prises en charge",
          icon: "i-lucide-stethoscope",
          to: "/affaires-sociales/prises-en-charge",
        },
        {
          label: "Visites médicales",
          icon: "i-lucide-heart-pulse",
          to: "/affaires-sociales/visites-medicales",
        },
      ],
      [
        { label: "Organismes", icon: "i-lucide-building", to: "/affaires-sociales/organismes" },
        {
          label: "Structures sanitaires",
          icon: "i-lucide-hospital",
          to: "/affaires-sociales/structures-sanitaires",
        },
      ],
    ],
  },
  {
    key: "formations",
    label: "Formation",
    description: "Catalogue, plan annuel, inscriptions et certifications (art. 92–104).",
    icon: "i-lucide-book-open",
    to: "/formations/catalogue",
    match: ["/formations"],
    gate: { anyPermission: ["consulter-formations"] },
    nav: [
      [
        { label: "Catalogue", icon: "i-lucide-library", to: "/formations/catalogue" },
        { label: "Plan annuel", icon: "i-lucide-calendar-check", to: "/formations/plans" },
        { label: "Inscriptions", icon: "i-lucide-user-plus", to: "/formations/inscriptions" },
        { label: "Certifications", icon: "i-lucide-award", to: "/formations/certifications" },
      ],
    ],
  },
  {
    key: "remuneration",
    label: "Rémunération",
    description: "Grille salariale, salaires des agents et paie mensuelle.",
    icon: "i-lucide-banknote",
    to: "/remuneration/grille",
    match: ["/remuneration", "/paie"],
    // `consulter-salaires` a été accordé au DG pour les reclassements : gater
    // dessus ouvrirait la grille et les salaires de tous les agents. On gate
    // donc sur `gerer-salaires`, que le DG n'a pas — et que la vague F a donné
    // au seul bureau Solde (`rh-solde`), en plus du `rh` généraliste. Tester
    // `anyRole: ["rh"]` aurait au contraire enfermé dehors tout le bureau Solde.
    // Le DG, lui, passe par Carrière > Reclassements.
    gate: { anyPermission: ["gerer-salaires"] },
    nav: [
      [
        { label: "Grille salariale", icon: "i-lucide-table-2", to: "/remuneration/grille" },
        { label: "Salaires agents", icon: "i-lucide-wallet", to: "/remuneration/salaires" },
        { label: "Éléments de paie", icon: "i-lucide-list-plus", to: "/paie/elements" },
        { label: "Lots de paie", icon: "i-lucide-banknote", to: "/paie/lots" },
      ],
    ],
  },
  {
    key: "administration",
    label: "Administration",
    description: "Comptes, structure organisationnelle et référentiels métier.",
    icon: "i-lucide-settings",
    to: "/structure/administrations",
    match: ["/structure", "/referentiels", "/administration"],
    // NB : `consulter-referentiels` est accordé largement (même à l'agent, pour
    // les listes déroulantes) → on gate sur des permissions réellement
    // « administration » pour ne pas exposer ce module à un agent simple.
    gate: { anyPermission: ["consulter-structure", "consulter-utilisateurs"] },
    navGates: {
      // Les comptes ne se montrent qu'à qui peut les consulter : un chef de
      // service a `consulter-structure` (il entre dans le module) mais n'a
      // rien à faire dans la gestion des accès.
      "/administration/utilisateurs": { anyPermission: ["consulter-utilisateurs"] },
      // `consulter-roles` : la RH lit la configuration, l'admin la modifie.
      "/administration/roles": { anyPermission: ["consulter-roles"] },
      // Seules portes gardées par un **rôle** et non par une permission : les
      // routes `/audit-logs` et `/parametres-application` portent `role:admin`.
      // La note FE §2k assume l'exception ; on la reproduit telle quelle, y
      // compris son corollaire — la RH n'y a pas accès.
      "/administration/audit": { anyRole: ["admin"] },
      "/administration/parametres": { anyRole: ["admin"] },
    },
    nav: [
      [
        { label: "Utilisateurs", icon: "i-lucide-users", to: "/administration/utilisateurs" },
        { label: "Rôles et permissions", icon: "i-lucide-key-round", to: "/administration/roles" },
        { label: "Journal d'audit", icon: "i-lucide-scroll-text", to: "/administration/audit" },
        { label: "Paramètres", icon: "i-lucide-sliders", to: "/administration/parametres" },
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
 * Porte d'entrée **réellement ouverte** d'un module : sa route d'atterrissage
 * si l'utilisateur y a droit, sinon le premier sous-onglet qu'il voit.
 *
 * Nécessaire depuis qu'un module peut être ouvert par une permission qui ne
 * donne pas accès à son onglet par défaut — le DG entre dans Carrière par
 * `consulter-salaires`, mais seul l'onglet Reclassements lui est visible :
 * l'envoyer sur `/carriere/affectations` le mettrait face à un 403.
 */
export function moduleEntry(m: AppModule, ctx: AccessContext): string {
  const visibles = visibleNav(m, ctx).flat();
  const atterrissageVisible = visibles.some((i) => i.to === m.to);
  if (atterrissageVisible || !visibles.length) return m.to;

  const premier = visibles.find((i) => typeof i.to === "string")
    ?? visibles.flatMap((i) => i.children ?? []).find((i) => typeof i.to === "string");

  return (premier?.to as string | undefined) ?? m.to;
}

/**
 * L'URL est-elle réellement ouverte à cet utilisateur ?
 *
 * `canAccessModule` ne regardait que la porte du **module**. Or plusieurs
 * sous-onglets ont leur propre règle (`navGates`) : `/evaluations/validation-rh`
 * est dans un module ouvert à tous les chefs, mais réservé à la RH. Une URL
 * tapée à la main passait donc la garde, la page s'affichait, l'appel partait
 * et revenait en **403**.
 *
 * On applique ici la règle la plus **spécifique** qui préfixe le chemin : une
 * fiche `/evaluations/validation-rh/12` hérite de la règle de son onglet.
 * Sans règle propre, seule la porte du module compte.
 */
export function canAccessPath(path: string, ctx: AccessContext): boolean {
  const m = moduleForPath(path);
  if (!m) return true; // hors module (login, 404…) : rien à garder ici.
  if (!canAccessModule(m, ctx)) return false;

  let regle: { gate: ModuleGate; longueur: number } | undefined;
  for (const [route, gate] of Object.entries(m.navGates ?? {})) {
    const correspond = path === route || path.startsWith(`${route}/`);
    if (correspond && (!regle || route.length > regle.longueur)) {
      regle = { gate, longueur: route.length };
    }
  }

  return regle ? satisfiesGate(regle.gate, ctx) : true;
}

/**
 * Route d'atterrissage après connexion : le premier module accessible. Le
 * module d'accueil n'ayant pas de `gate`, tout le monde atterrit sur son
 * espace ; les modules métier restent à un onglet de distance.
 */
export function landingRoute(ctx: AccessContext): string {
  const premier = accessibleModules(ctx)[0];
  return premier ? moduleEntry(premier, ctx) : "/mon-espace";
}
