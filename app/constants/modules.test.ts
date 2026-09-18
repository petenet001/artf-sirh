import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  accessibleModules,
  canAccessModule,
  canAccessPath,
  landingRoute,
  moduleEntry,
  moduleForPath,
  modules,
  visibleNav,
  type AccessContext,
} from "./modules";

/**
 * Matrice d'accès du portail. Les jeux de permissions par rôle reflètent
 * `database/seeders/RoleSeeder.php` (guard `api`).
 */
/** `directeur`, `chef-service` et `chef-bureau` — identiques dans `RoleSeeder`. */
const ROLES_HIERARCHIE_PERMS = [
  "consulter-structure",
  "consulter-referentiels",
  "consulter-agents",
  "consulter-nominations",
  "consulter-conges",
  "creer-conges",
  "valider-conges",
  "consulter-absences",
  "creer-absences",
  "valider-absences",
  // Il propose une sanction pour son équipe, sans voir les dossiers des autres.
  "proposer-discipline",
  // Notateur au sens CCN art. 64 : il note et signe les fiches de son équipe.
  "consulter-evaluations",
  "valider-evaluations",
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  agent: [
    "consulter-referentiels",
    "consulter-conges", "creer-conges", "consulter-absences", "creer-absences",
    // L'agent consulte sa fiche, la signe et peut réclamer (CCN art. 63/65).
    "consulter-evaluations",
  ],
  // Les trois rôles hiérarchiques portent **exactement** le même jeu de
  // permissions dans le seeder : ce qui les distingue est le périmètre
  // (vague F), pas les droits. On les décrit donc une fois.
  "chef-service": ROLES_HIERARCHIE_PERMS,
  "chef-bureau": ROLES_HIERARCHIE_PERMS,
  directeur: ROLES_HIERARCHIE_PERMS,
  // Le rôle RH généraliste — recopié de `RoleSeeder::$roles['rh']`.
  rh: [
    "consulter-utilisateurs", "creer-utilisateurs", "modifier-utilisateurs", "consulter-roles",
    "consulter-structure", "consulter-referentiels", "creer-referentiels", "modifier-referentiels",
    "consulter-agents", "consulter-agents-global", "creer-agents", "modifier-agents",
    "consulter-recrutement", "creer-recrutement", "valider-recrutement",
    "consulter-contrats", "creer-contrats", "modifier-contrats",
    "consulter-nominations", "gerer-nominations",
    "consulter-salaires", "gerer-salaires",
    "consulter-conges", "creer-conges", "valider-conges",
    "consulter-absences", "creer-absences", "valider-absences",
    "consulter-discipline", "gerer-discipline", "proposer-discipline",
    "consulter-affaires-sociales", "gerer-affaires-sociales",
    "consulter-formations", "gerer-formations",
    "consulter-evaluations", "creer-evaluations", "valider-evaluations",
    "consulter-reporting",
  ],
  "directeur-general": [
    "consulter-structure", "consulter-referentiels", "consulter-agents", "consulter-agents-global",
    "consulter-nominations", "consulter-salaires",
    "consulter-conges", "valider-conges", "consulter-absences", "valider-absences",
    "consulter-discipline", "prononcer-discipline",
    "consulter-affaires-sociales", "decider-prestations",
    "consulter-formations",
    "consulter-evaluations", "valider-evaluations",
    "consulter-reporting",
  ],

  // ── Vague F : la DRHL éclatée en cinq bureaux ──────────────────────────────
  // Chaque rôle ne porte que les permissions de son bureau. Ils sont ici pour
  // qu'une porte trop large (ou trop étroite) se voie au test, pas en recette.
  "rh-personnel": [
    "acces-bureau-personnel",
    "consulter-structure", "consulter-referentiels",
    "consulter-agents", "consulter-agents-global", "creer-agents", "modifier-agents",
    "consulter-recrutement", "creer-recrutement", "valider-recrutement",
    "consulter-contrats", "creer-contrats", "modifier-contrats",
    "consulter-nominations", "gerer-nominations",
    "consulter-conges", "valider-conges", "consulter-absences", "valider-absences",
    "consulter-discipline", "gerer-discipline", "proposer-discipline",
    "consulter-evaluations",
    "consulter-utilisateurs", "creer-utilisateurs", "modifier-utilisateurs",
  ],
  "rh-solde": [
    "acces-bureau-solde",
    "consulter-structure", "consulter-referentiels", "consulter-agents", "consulter-agents-global",
    "consulter-salaires", "gerer-salaires", "consulter-reporting",
  ],
  "rh-formation": [
    "acces-bureau-formation",
    "consulter-structure", "consulter-referentiels", "consulter-agents", "consulter-agents-global",
    "consulter-formations", "gerer-formations", "consulter-evaluations",
  ],
  "rh-affaires-sociales": [
    "acces-bureau-affaires-sociales",
    "consulter-structure", "consulter-referentiels", "consulter-agents", "consulter-agents-global",
    "consulter-affaires-sociales", "gerer-affaires-sociales", "decider-prestations",
  ],
  "rh-etude": [
    "acces-bureau-etude",
    "consulter-structure", "consulter-referentiels", "consulter-agents", "consulter-agents-global",
    "consulter-evaluations", "consulter-reporting",
  ],
};

/**
 * `admin` porte **toutes** les permissions (`RoleSeeder` lui assigne `$all`).
 *
 * On les reconstitue depuis trois sources, parce qu'aucune ne suffit seule :
 * les portes de module, celles de sous-onglet, et les permissions attribuées
 * aux autres rôles — `consulter-agents-global`, par exemple, ne garde aucun
 * écran (c'est un périmètre, pas une porte) et n'apparaîtrait nulle part
 * ailleurs.
 */
ROLE_PERMISSIONS.admin = [
  ...new Set([
    ...Object.values(ROLE_PERMISSIONS).flat(),
    ...modules.flatMap((m) => [
      ...(m.gate?.anyPermission ?? []),
      ...Object.values(m.navGates ?? {}).flatMap((g) => g.anyPermission ?? []),
    ]),
  ]),
];

function ctxForRole(role: string, scopes: string[] = []): AccessContext {
  const perms = new Set(ROLE_PERMISSIONS[role] ?? []);
  return {
    can: (p) => perms.has(p),
    hasRole: (r) => r === role,
    hasScope: (s) => scopes.includes(s),
  };
}

const HIERARCHIE = ["directeur", "chef-service", "chef-bureau"];
const BUREAUX = ["rh-personnel", "rh-solde", "rh-formation", "rh-affaires-sociales", "rh-etude"];

/** Contexte « tout permis », pour explorer la navigation dans son ensemble. */
const ctxAdmin = ctxForRole("admin");

const accueil = modules.find((m) => m.key === "tableau-de-bord")!;
const navTo = (ctx: AccessContext) => visibleNav(accueil, ctx).flat().map((i) => i.to);

const keys = (ctx: AccessContext) => accessibleModules(ctx).map((m) => m.key);

describe("accès aux modules par rôle", () => {
  it("agent simple : accueil + congés/absences (self-service), atterrit sur /mon-espace", () => {
    const ctx = ctxForRole("agent");
    // L'agent a `consulter-conges`/`consulter-absences` (seeder) → le module
    // Congés lui est ouvert pour ses propres demandes. Pas d'autre module métier.
    expect(keys(ctx)).toEqual(["tableau-de-bord", "conges", "evaluations"]);
    expect(landingRoute(ctx)).toBe("/mon-espace");
  });

  it("chef-service : personnel + administration en plus de l'accueil", () => {
    const ctx = ctxForRole("chef-service");
    expect(keys(ctx)).toEqual(
      expect.arrayContaining(["tableau-de-bord", "personnel", "administration"]),
    );
    expect(keys(ctx)).not.toContain("integration");
  });

  it("rh : voit tous les modules métier", () => {
    const ctx = ctxForRole("rh");
    expect(keys(ctx)).toEqual(
      expect.arrayContaining(["tableau-de-bord", "personnel", "integration", "evaluations", "administration"]),
    );
  });

  it("admin : voit l'intégralité des modules", () => {
    const ctx = ctxForRole("admin");
    expect(keys(ctx)).toEqual(modules.map((m) => m.key));
  });

  it("tout le monde atterrit sur son espace : le module d'accueil n'a pas de gate", () => {
    for (const role of ["agent", "chef-service", "rh", "admin"]) {
      expect(landingRoute(ctxForRole(role))).toBe("/mon-espace");
    }
  });
});

describe("sous-onglets du module d'accueil", () => {
  it("agent simple : Mon espace seulement", () => {
    expect(navTo(ctxForRole("agent"))).toEqual(["/mon-espace"]);
  });

  it("responsable d'entité : le sous-onglet « Mon entité » apparaît", () => {
    expect(navTo(ctxForRole("agent", ["entite"]))).toEqual(["/mon-espace", "/mon-entite"]);
  });

  it("RH : la vue d'ensemble s'ajoute (permission de reporting)", () => {
    expect(navTo(ctxForRole("rh"))).toEqual(["/mon-espace", "/tableau-de-bord"]);
  });

  it("responsable ET RH : les trois onglets, dans l'ordre déclaré", () => {
    expect(navTo(ctxForRole("rh", ["entite"]))).toEqual([
      "/mon-espace",
      "/mon-entite",
      "/tableau-de-bord",
    ]);
  });

  it("les écrans personnels restent rattachés au module d'accueil, sans onglet dédié", () => {
    // Ils sont atteints par les cartes de Mon espace, pas par la sous-navigation.
    for (const route of [
      "/mon-espace/dossier",
      "/mon-espace/carriere",
      "/mon-espace/conges",
      "/mon-espace/absences",
      "/mon-espace/discipline",
    ]) {
      expect(moduleForPath(route)?.key).toBe("tableau-de-bord");
      expect(navTo(ctxForRole("agent"))).not.toContain(route);
    }
  });

  it("le profil reste rattaché au module sans être un onglet (pas de doublon)", () => {
    expect(moduleForPath("/profil")?.key).toBe("tableau-de-bord");
    expect(navTo(ctxForRole("admin", ["entite"]))).not.toContain("/profil");
  });
});

describe("sous-onglets du module Évaluations", () => {
  const evaluations = modules.find((m) => m.key === "evaluations")!;
  const onglets = (ctx: AccessContext) => visibleNav(evaluations, ctx).flat().map((i) => i.to);

  it("agent : seulement ses propres fiches", () => {
    expect(onglets(ctxForRole("agent"))).toEqual(["/evaluations/mes-evaluations"]);
  });

  it("chef : ses fiches + la file de notation, jamais les écrans RH", () => {
    const ctx = ctxForRole("chef-service");
    expect(onglets(ctx)).toEqual(["/evaluations/mes-evaluations", "/evaluations/a-noter"]);
    // `valider-evaluations` est détenu par tous les chefs : il ne doit pas
    // ouvrir la validation RH ni le paramétrage de la grille.
    expect(onglets(ctx)).not.toContain("/evaluations/validation-rh");
    expect(onglets(ctx)).not.toContain("/evaluations/criteres");
  });

  it("rh : la totalité des onglets", () => {
    expect(onglets(ctxForRole("rh"))).toEqual([
      "/evaluations/mes-evaluations",
      "/evaluations/a-noter",
      "/evaluations/sessions",
      "/evaluations/validation-rh",
      "/evaluations/tableau",
      "/evaluations/bonifications",
      "/evaluations/criteres",
    ]);
  });

  it("DG : siège en commission sans accéder au métier RH", () => {
    const ctx = ctxForRole("directeur-general");
    expect(onglets(ctx)).toEqual([
      "/evaluations/mes-evaluations",
      "/evaluations/a-noter",
      "/evaluations/tableau",
      "/evaluations/bonifications",
    ]);
    expect(onglets(ctx)).not.toContain("/evaluations/validation-rh");
    expect(onglets(ctx)).not.toContain("/evaluations/sessions");
  });

  it("atterrit sur « Mes évaluations », l'écran ouvert à tous", () => {
    expect(evaluations.to).toBe("/evaluations/mes-evaluations");
    expect(moduleForPath("/evaluations/fiches/12")?.key).toBe("evaluations");
  });
});

describe("module Carrière ouvert au DG (reclassements et positions)", () => {
  const carriere = modules.find((m) => m.key === "carriere")!;
  const onglets = (ctx: AccessContext) => visibleNav(carriere, ctx).flat().map((i) => i.to);

  it("le DG entre dans Carrière, mais n'y voit que ce qu'il décide", () => {
    const ctx = ctxForRole("directeur-general");
    expect(canAccessModule(carriere, ctx)).toBe(true);
    // Il approuve les reclassements (art. 74–75) et les positions (art. 76–80).
    expect(onglets(ctx)).toEqual(["/carriere/reclassements", "/carriere/positions"]);
  });

  it("sa porte d'entrée est l'onglet visible, pas l'atterrissage du module", () => {
    expect(moduleEntry(carriere, ctxForRole("directeur-general"))).toBe("/carriere/reclassements");
    // Pour la RH, l'atterrissage habituel reste inchangé.
    expect(moduleEntry(carriere, ctxForRole("rh"))).toBe("/carriere/affectations");
  });

  it("la Rémunération reste fermée au DG malgré `consulter-salaires`", () => {
    const remuneration = modules.find((m) => m.key === "remuneration")!;
    expect(canAccessModule(remuneration, ctxForRole("directeur-general"))).toBe(false);
    expect(canAccessModule(remuneration, ctxForRole("rh"))).toBe(true);
  });
});

describe("module Discipline : un rôle, une porte (CCN art. 90–91)", () => {
  const discipline = modules.find((m) => m.key === "discipline")!;
  const onglets = (ctx: AccessContext) => visibleNav(discipline, ctx).flat().map((i) => i.to);

  it("l'agent n'y a pas accès : son dossier vit dans Mon espace", () => {
    expect(canAccessModule(discipline, ctxForRole("agent"))).toBe(false);
  });

  it("le chef entre pour ses rapports, sans les avertissements RH", () => {
    const ctx = ctxForRole("chef-service");
    expect(canAccessModule(discipline, ctx)).toBe(true);
    expect(onglets(ctx)).toEqual(["/discipline/dossiers", "/discipline/types-sanctions"]);
  });

  it("le DG entre pour prononcer", () => {
    expect(canAccessModule(discipline, ctxForRole("directeur-general"))).toBe(true);
  });

  it("la RH voit les trois onglets", () => {
    expect(onglets(ctxForRole("rh"))).toEqual([
      "/discipline/dossiers",
      "/discipline/avertissements",
      "/discipline/types-sanctions",
    ]);
  });
});

describe("module Affaires sociales (P1)", () => {
  const social = modules.find((m) => m.key === "affaires-sociales")!;

  it("ouvert à la RH et au DG, fermé aux chefs et aux agents", () => {
    expect(canAccessModule(social, ctxForRole("rh"))).toBe(true);
    expect(canAccessModule(social, ctxForRole("directeur-general"))).toBe(true);
    expect(canAccessModule(social, ctxForRole("chef-service"))).toBe(false);
    expect(canAccessModule(social, ctxForRole("agent"))).toBe(false);
  });
});

describe("module Formation (D.4)", () => {
  const formations = modules.find((m) => m.key === "formations")!;

  it("ouvert à la RH et au DG, fermé aux chefs et aux agents", () => {
    expect(canAccessModule(formations, ctxForRole("rh"))).toBe(true);
    expect(canAccessModule(formations, ctxForRole("directeur-general"))).toBe(true);
    expect(canAccessModule(formations, ctxForRole("chef-service"))).toBe(false);
    expect(canAccessModule(formations, ctxForRole("agent"))).toBe(false);
  });
});

describe("module Rémunération étendu à la paie (D.5)", () => {
  const remuneration = modules.find((m) => m.key === "remuneration")!;
  const onglets = (ctx: AccessContext) => visibleNav(remuneration, ctx).flat().map((i) => i.to);

  it("la paie rejoint la rémunération plutôt que d'ouvrir un module de plus", () => {
    expect(onglets(ctxForRole("rh"))).toEqual([
      "/remuneration/grille",
      "/remuneration/salaires",
      "/paie/elements",
      "/paie/lots",
    ]);
    expect(moduleForPath("/paie/lots/4")?.key).toBe("remuneration");
  });

  it("reste fermé au DG, qui n'a que `consulter-salaires`", () => {
    expect(canAccessModule(remuneration, ctxForRole("directeur-general"))).toBe(false);
  });
});

describe("moduleForPath", () => {
  it("résout le module d'une route métier", () => {
    expect(moduleForPath("/personnel/agents")?.key).toBe("personnel");
    expect(moduleForPath("/personnel/agents/12")?.key).toBe("personnel");
    expect(moduleForPath("/integration/dossiers")?.key).toBe("integration");
    expect(moduleForPath("/carriere/reclassements/7")?.key).toBe("carriere");
    expect(moduleForPath("/discipline/dossiers/3")?.key).toBe("discipline");
    expect(moduleForPath("/affaires-sociales/ayants-droit")?.key).toBe("affaires-sociales");
    expect(moduleForPath("/formations/plans")?.key).toBe("formations");
    // Le self-service disciplinaire reste rattaché au module d'accueil.
    expect(moduleForPath("/mon-espace/discipline")?.key).toBe("tableau-de-bord");
    expect(moduleForPath("/referentiels/grades")?.key).toBe("administration");
    expect(moduleForPath("/structure/directions")?.key).toBe("administration");
    expect(moduleForPath("/profil")?.key).toBe("tableau-de-bord");
    expect(moduleForPath("/mon-espace")?.key).toBe("tableau-de-bord");
    expect(moduleForPath("/mon-entite")?.key).toBe("tableau-de-bord");
  });

  it("renvoie undefined pour une route hors module", () => {
    expect(moduleForPath("/inconnu")).toBeUndefined();
    expect(moduleForPath("/")).toBeUndefined();
  });
});

describe("canAccessModule", () => {
  it("un module sans gate est toujours accessible", () => {
    const ctxVide: AccessContext = { can: () => false, hasRole: () => false };
    expect(canAccessModule(accueil, ctxVide)).toBe(true);
  });

  it("refuse un module dont la permission n'est pas satisfaite", () => {
    const personnel = modules.find((m) => m.key === "personnel")!;
    expect(canAccessModule(personnel, ctxForRole("agent"))).toBe(false);
    expect(canAccessModule(personnel, ctxForRole("rh"))).toBe(true);
  });
});

describe("vague F : les cinq rôles de bureau DRHL franchissent les bonnes portes", () => {
  /**
   * Le piège de la vague F : les portes écrites `anyRole: ["rh"]` enfermaient
   * dehors des agents qui portent pourtant les bonnes permissions. Ces tests
   * fixent, bureau par bureau, ce qui doit s'ouvrir — et surtout ce qui ne doit
   * pas : un bureau n'est pas un RH généraliste au rabais, c'est un périmètre.
   */
  const voit = (role: string, cle: string) =>
    canAccessModule(modules.find((m) => m.key === cle)!, ctxForRole(role));

  it("le bureau Solde entre dans Rémunération — c'est son métier", () => {
    expect(voit("rh-solde", "remuneration")).toBe(true);
  });

  it("aucun autre bureau n'entre dans Rémunération", () => {
    for (const role of ["rh-personnel", "rh-formation", "rh-affaires-sociales", "rh-etude"]) {
      expect(voit(role, "remuneration")).toBe(false);
    }
    // Et le DG non plus, malgré `consulter-salaires` (il n'a pas `gerer-salaires`).
    expect(voit("directeur-general", "remuneration")).toBe(false);
  });

  it("le bureau des Affaires sociales entre dans son module, le bureau Formation non", () => {
    expect(voit("rh-affaires-sociales", "affaires-sociales")).toBe(true);
    expect(voit("rh-formation", "affaires-sociales")).toBe(false);
  });

  it("le bureau Formation entre dans Formation, le bureau Solde non", () => {
    expect(voit("rh-formation", "formations")).toBe(true);
    expect(voit("rh-solde", "formations")).toBe(false);
  });

  it("le bureau Personnel tient les congés et la discipline, pas la paie ni le social", () => {
    expect(voit("rh-personnel", "conges")).toBe(true);
    expect(voit("rh-personnel", "discipline")).toBe(true);
    expect(voit("rh-personnel", "remuneration")).toBe(false);
    expect(voit("rh-personnel", "affaires-sociales")).toBe(false);
  });

  it("le bureau Étude voit le reporting sans toucher aux dossiers", () => {
    const accueil = modules.find((m) => m.key === "tableau-de-bord")!;
    const onglets = visibleNav(accueil, ctxForRole("rh-etude")).flat().map((i) => i.to);
    expect(onglets).toContain("/tableau-de-bord");
    expect(voit("rh-etude", "discipline")).toBe(false);
    expect(voit("rh-etude", "affaires-sociales")).toBe(false);
  });

  it("le DG décide les prestations : le module Affaires sociales lui reste ouvert", () => {
    expect(voit("directeur-general", "affaires-sociales")).toBe(true);
  });
});

describe("module Affaires sociales : protection sociale, prestations, santé", () => {
  const social = modules.find((m) => m.key === "affaires-sociales")!;
  const onglets = (ctx: AccessContext) => visibleNav(social, ctx).flat().map((i) => i.to);

  it("expose les trois blocs au bureau des Affaires sociales", () => {
    expect(onglets(ctxForRole("rh-affaires-sociales"))).toEqual([
      "/affaires-sociales/affiliations",
      "/affaires-sociales/ayants-droit",
      "/affaires-sociales/prestations",
      "/affaires-sociales/arrets",
      "/affaires-sociales/prises-en-charge",
      "/affaires-sociales/visites-medicales",
      "/affaires-sociales/organismes",
      "/affaires-sociales/structures-sanitaires",
    ]);
  });

  it("reste fermé à l'agent et au chef de service", () => {
    expect(canAccessModule(social, ctxForRole("agent"))).toBe(false);
    expect(canAccessModule(social, ctxForRole("chef-service"))).toBe(false);
  });
});

describe("canAccessPath : la garde regarde le chemin, pas seulement le module", () => {
  /**
   * C'est le correctif du symptôme « je suis déconnecté sans savoir pourquoi ».
   * Une URL tapée vers un sous-onglet interdit passait la garde (qui ne testait
   * que le module), la page s'affichait, son premier appel repartait en 403 —
   * et le client HTTP, qui confondait 403 et 401, coupait la session.
   *
   * Ces tests fixent le premier maillon : la page ne doit même pas s'ouvrir.
   */
  it("laisse passer un chemin hors module (login, 404)", () => {
    expect(canAccessPath("/login", ctxForRole("agent"))).toBe(true);
    expect(canAccessPath("/une-route-inconnue", ctxForRole("agent"))).toBe(true);
  });

  it("ferme un sous-onglet réservé alors que le module est ouvert", () => {
    const chef = ctxForRole("chef-service");
    // Le module Évaluations lui est ouvert : il note son équipe…
    expect(canAccessPath("/evaluations/a-noter", chef)).toBe(true);
    // …mais la validation RH et les sessions ne le sont pas.
    expect(canAccessPath("/evaluations/validation-rh", chef)).toBe(false);
    expect(canAccessPath("/evaluations/sessions", chef)).toBe(false);
  });

  it("applique la règle de l'onglet à ses sous-routes", () => {
    const chef = ctxForRole("chef-service");
    expect(canAccessPath("/evaluations/validation-rh/12", chef)).toBe(false);
    expect(canAccessPath("/evaluations/a-noter/12", chef)).toBe(true);
  });

  it("retient la règle la plus spécifique quand plusieurs préfixent le chemin", () => {
    const dg = ctxForRole("directeur-general");
    // Carrière est ouvert au DG par `consulter-salaires`, mais seuls
    // reclassements et positions le sont réellement.
    expect(canAccessPath("/carriere/reclassements/4", dg)).toBe(true);
    expect(canAccessPath("/carriere/affectations", dg)).toBe(false);
    expect(canAccessPath("/carriere/contrats", dg)).toBe(false);
  });

  it("ferme tout le module quand sa porte principale est fermée", () => {
    const agent = ctxForRole("agent");
    expect(canAccessPath("/personnel/agents", agent)).toBe(false);
    expect(canAccessPath("/affaires-sociales/prestations", agent)).toBe(false);
  });

  it("laisse un onglet sans règle propre suivre la porte du module", () => {
    // `/personnel/stagiaires` n'a pas de `navGates` : seule compte `consulter-agents`.
    expect(canAccessPath("/personnel/stagiaires", ctxForRole("rh"))).toBe(true);
    expect(canAccessPath("/personnel/stagiaires", ctxForRole("agent"))).toBe(false);
  });

  it("ouvre au bureau des Affaires sociales ses écrans santé", () => {
    const bas = ctxForRole("rh-affaires-sociales");
    expect(canAccessPath("/affaires-sociales/arrets/7", bas)).toBe(true);
    expect(canAccessPath("/affaires-sociales/prestations", bas)).toBe(true);
    // Mais pas la paie du bureau Solde.
    expect(canAccessPath("/paie/lots", bas)).toBe(false);
  });
});

describe("Administration : les comptes ne se montrent qu'aux gestionnaires d'accès", () => {
  const admin = modules.find((m) => m.key === "administration")!;
  const onglets = (ctx: AccessContext) => visibleNav(admin, ctx).flat().map((i) => i.to);

  it("expose l'écran des comptes à la RH et à l'administrateur", () => {
    for (const role of ["rh", "admin", "rh-personnel"]) {
      expect(onglets(ctxForRole(role))).toContain("/administration/utilisateurs");
      expect(canAccessPath("/administration/utilisateurs", ctxForRole(role))).toBe(true);
    }
  });

  it("le masque à un chef de service, qui entre pourtant dans le module", () => {
    const chef = ctxForRole("chef-service");
    // `consulter-structure` lui ouvre le module (référentiels, organigramme)…
    expect(canAccessModule(admin, chef)).toBe(true);
    // …mais pas la gestion des accès.
    expect(onglets(chef)).not.toContain("/administration/utilisateurs");
    expect(canAccessPath("/administration/utilisateurs", chef)).toBe(false);
  });

  it("reste entièrement fermé à l'agent", () => {
    expect(canAccessModule(admin, ctxForRole("agent"))).toBe(false);
    expect(canAccessPath("/administration/utilisateurs", ctxForRole("agent"))).toBe(false);
  });
});

describe("recette FE §2k.8 : ce que chaque profil doit voir, et surtout ne pas voir", () => {
  /**
   * Transcription de la recette du backend (note FE §2k.8). Elle sert de
   * contre-épreuve à la matrice : c'est là qu'on attrape une porte trop large,
   * qui se traduirait en 403 pour l'utilisateur.
   */
  const voit = (role: string, cle: string) =>
    canAccessModule(modules.find((m) => m.key === cle)!, ctxForRole(role));

  it("1. l'agent n'a ni Paie, ni Personnel, ni Recrutement", () => {
    for (const cle of ["remuneration", "personnel", "integration", "administration"]) {
      expect(voit("agent", cle)).toBe(false);
    }
    // Il garde son self-service congés et la lecture de sa fiche d'évaluation.
    expect(voit("agent", "conges")).toBe(true);
    expect(voit("agent", "evaluations")).toBe(true);
  });

  it("3. le directeur voit les agents et les congés, mais pas la vue d'ensemble RH", () => {
    const directeur = ctxForRole("directeur");
    expect(voit("directeur", "personnel")).toBe(true);
    expect(voit("directeur", "conges")).toBe(true);
    expect(voit("directeur", "remuneration")).toBe(false);
    expect(voit("directeur", "integration")).toBe(false);
    // Le point qui manquait : la vue d'ensemble n'appelle que `/reporting/*`.
    expect(canAccessPath("/tableau-de-bord", directeur)).toBe(false);
  });

  it("4. un agent du bureau Formation a son self-service et Formations, pas la Paie", () => {
    // Cumul réel : `agent` + `rh-formation`. Le contexte de test ne portant
    // qu'un rôle, on vérifie la partie discriminante — la permission.
    expect(voit("rh-formation", "formations")).toBe(true);
    expect(voit("rh-formation", "remuneration")).toBe(false);
  });

  it("6. le DG a le reporting et la discipline, pas la gestion des comptes", () => {
    const dg = ctxForRole("directeur-general");
    expect(canAccessPath("/tableau-de-bord", dg)).toBe(true);
    expect(voit("directeur-general", "discipline")).toBe(true);
    expect(canAccessPath("/administration/utilisateurs", dg)).toBe(false);
  });

  it("la vue d'ensemble RH n'est ouverte qu'aux porteurs de `consulter-reporting`", () => {
    for (const role of ["rh", "admin", "directeur-general", "rh-solde", "rh-etude"]) {
      expect(canAccessPath("/tableau-de-bord", ctxForRole(role))).toBe(true);
    }
    for (const role of ["directeur", "chef-service", "chef-bureau", "agent", "rh-personnel"]) {
      expect(canAccessPath("/tableau-de-bord", ctxForRole(role))).toBe(false);
    }
  });
});

describe("matrice des menus (note FE §2k.3) — transcription intégrale", () => {
  /**
   * Chaque ligne de la matrice du backend, vérifiée dans les deux sens : qui
   * doit voir l'écran, **et qui ne doit pas**. C'est le second sens qui compte
   * le plus — une porte trop large ne se voit pas à l'usage, elle se traduit en
   * 403 pour l'utilisateur concerné, et c'est exactement ce qui s'était produit
   * sur la vue d'ensemble RH.
   *
   * La matrice raisonne en permissions, jamais en noms de rôle : les rôles ne
   * servent ici qu'à instancier un contexte de test réaliste.
   */
  /** `[écran, rôles qui doivent le voir, rôles qui ne doivent pas]` */
  const MATRICE: [string, string[], string[]][] = [
    [
      "/tableau-de-bord",
      ["admin", "rh", "directeur-general", "rh-solde", "rh-etude"],
      [...HIERARCHIE, "agent", "rh-personnel", "rh-formation", "rh-affaires-sociales"],
    ],
    ["/administration/utilisateurs", ["admin", "rh", "rh-personnel"], [...HIERARCHIE, "agent"]],
    // « Rôles / permissions » : `admin` + `rh` en lecture, personne d'autre.
    ["/administration/roles", ["admin", "rh"], [...HIERARCHIE, "agent", ...BUREAUX]],
    // « Audit / paramètres app » : `admin` **uniquement**, la RH comprise.
    ["/administration/audit", ["admin"], ["rh", ...HIERARCHIE, "agent", ...BUREAUX]],
    ["/administration/parametres", ["admin"], ["rh", ...HIERARCHIE, "agent", ...BUREAUX]],
    ["/structure/directions", ["admin", "rh", ...HIERARCHIE, ...BUREAUX], ["agent"]],
    ["/integration/dossiers", ["admin", "rh", "rh-personnel"], [...HIERARCHIE, "agent"]],
    ["/personnel/agents", ["admin", "rh", ...HIERARCHIE, ...BUREAUX], ["agent"]],
    ["/carriere/contrats", ["admin", "rh", "rh-personnel"], [...HIERARCHIE, "agent"]],
    ["/conges/demandes", ["admin", "rh", ...HIERARCHIE, "agent"], []],
    ["/conges/parametrage", ["admin", "rh", ...HIERARCHIE], ["agent"]],
    ["/evaluations/sessions", ["admin", "rh"], [...HIERARCHIE, "agent"]],
    ["/evaluations/a-noter", ["admin", "rh", "directeur-general", ...HIERARCHIE], ["agent"]],
    [
      "/discipline/dossiers",
      ["admin", "rh", "directeur-general", "rh-personnel", ...HIERARCHIE],
      ["agent"],
    ],
    [
      "/affaires-sociales/affiliations",
      ["admin", "rh", "directeur-general", "rh-affaires-sociales"],
      [...HIERARCHIE, "agent", "rh-solde", "rh-formation"],
    ],
    [
      "/formations/catalogue",
      ["admin", "rh", "directeur-general", "rh-formation"],
      [...HIERARCHIE, "agent", "rh-solde", "rh-personnel"],
    ],
    [
      "/remuneration/grille",
      ["admin", "rh", "rh-solde"],
      [...HIERARCHIE, "agent", "rh-formation", "rh-etude", "rh-affaires-sociales"],
    ],
  ];

  it.each(MATRICE)("%s", (route, voient, neVoientPas) => {
    for (const role of voient) {
      expect(canAccessPath(route, ctxForRole(role)), `${role} devrait voir ${route}`).toBe(true);
    }
    for (const role of neVoientPas) {
      expect(canAccessPath(route, ctxForRole(role)), `${role} ne devrait PAS voir ${route}`).toBe(
        false,
      );
    }
  });

  it("l'agent n'a que son espace, ses congés et la lecture de sa fiche", () => {
    expect(keys(ctxForRole("agent"))).toEqual(["tableau-de-bord", "conges", "evaluations"]);
  });

  it("la cloche de notifications ne dépend d'aucune permission", () => {
    // Elle vit dans la navbar, hors du système de modules : rien à garder.
    const accueil = modules.find((m) => m.key === "tableau-de-bord")!;
    expect(accueil.gate).toBeUndefined();
  });
});

describe("intégrité du menu : aucune entrée ne mène nulle part", () => {
  /**
   * Un menu qui pointe vers une page inexistante est pire qu'un menu absent :
   * l'utilisateur clique, tombe sur un 404, et croit l'application cassée.
   * Le cas arrive au premier renommage de fichier — rien d'autre ne le
   * signalerait avant la recette.
   */
  const pages = join(process.cwd(), "app", "pages");

  /** Une route de menu est-elle servie par un fichier de page ? */
  function estServie(route: string): boolean {
    const segments = route.replace(/^\//, "").split("/");
    const candidats = [
      join(pages, ...segments) + ".vue",
      join(pages, ...segments, "index.vue"),
    ];
    return candidats.some((chemin) => existsSync(chemin));
  }

  const routes = [
    ...new Set(
      modules.flatMap((m) => [
        m.to,
        ...visibleNav(m, ctxAdmin)
          .flat()
          .flatMap((i) => [i.to, ...(i.children ?? []).map((c) => c.to)]),
      ]),
    ),
  ].filter((r): r is string => typeof r === "string");

  it("résout chaque destination de la navigation", () => {
    expect(routes.length).toBeGreaterThan(30);
    expect(routes.filter((r) => !estServie(r))).toEqual([]);
  });

  it("garde chaque route d'atterrissage de module servie et autorisée pour l'admin", () => {
    for (const m of modules) {
      expect(estServie(m.to), `${m.key} → ${m.to}`).toBe(true);
      expect(canAccessPath(moduleEntry(m, ctxAdmin), ctxAdmin), m.key).toBe(true);
    }
  });
});

describe("vue globale sur le personnel (`consulter-agents-global`, 18/09)", () => {
  /**
   * La permission ne change aucune **porte** — l'écran Personnel s'ouvre sur
   * `consulter-agents` comme avant. Elle change le **périmètre** : le métier RH
   * transverse voit tout l'effectif même rattaché à un bureau, la hiérarchie
   * reste limitée à sa structure. C'est donc une affaire d'affichage, pas de
   * menu, et ces tests fixent qui la détient.
   */
  it("est portée par tout le métier RH, la DG et l'administrateur", () => {
    for (const role of ["admin", "rh", "directeur-general", ...BUREAUX]) {
      expect(ctxForRole(role).can("consulter-agents-global"), role).toBe(true);
    }
  });

  it("n'est portée par aucun rôle hiérarchique ni par l'agent", () => {
    for (const role of [...HIERARCHIE, "agent"]) {
      expect(ctxForRole(role).can("consulter-agents-global"), role).toBe(false);
    }
  });

  it("n'ouvre à elle seule aucun écran : Personnel reste sur `consulter-agents`", () => {
    // Un compte qui n'aurait que la vue globale sans le droit de consulter ne
    // doit pas entrer — la porte et le périmètre sont deux notions distinctes.
    const ctx = {
      can: (p: string) => p === "consulter-agents-global",
      hasRole: () => false,
      hasScope: () => false,
    };
    expect(canAccessPath("/personnel/agents", ctx)).toBe(false);
  });
});
