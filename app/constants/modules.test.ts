import { describe, it, expect } from "vitest";
import {
  accessibleModules,
  canAccessModule,
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
const ROLE_PERMISSIONS: Record<string, string[]> = {
  agent: [
    "consulter-referentiels",
    "consulter-conges", "creer-conges", "consulter-absences", "creer-absences",
    // L'agent consulte sa fiche, la signe et peut réclamer (CCN art. 63/65).
    "consulter-evaluations",
  ],
  "chef-service": [
    "consulter-structure",
    "consulter-referentiels",
    "consulter-agents",
    "consulter-conges",
    "valider-conges",
    "consulter-absences",
    // Il propose une sanction pour son équipe, sans voir les dossiers des autres.
    "proposer-discipline",
    // Notateur au sens CCN art. 64 : il note et signe les fiches de son équipe.
    "consulter-evaluations",
    "valider-evaluations",
  ],
  rh: [
    "consulter-utilisateurs", "creer-utilisateurs", "modifier-utilisateurs",
    "consulter-structure", "consulter-referentiels", "creer-referentiels", "modifier-referentiels",
    "consulter-agents", "creer-agents", "modifier-agents",
    "consulter-recrutement", "creer-recrutement", "valider-recrutement",
    "consulter-contrats", "creer-contrats", "modifier-contrats",
    "consulter-conges", "valider-conges", "consulter-absences", "valider-absences",
    "consulter-discipline", "gerer-discipline", "proposer-discipline",
    "consulter-affaires-sociales", "gerer-affaires-sociales",
    "consulter-formations", "gerer-formations",
    "consulter-evaluations", "creer-evaluations", "valider-evaluations",
    "consulter-reporting",
  ],
  "directeur-general": [
    "consulter-structure", "consulter-referentiels", "consulter-agents",
    "consulter-nominations", "consulter-salaires",
    "consulter-conges", "valider-conges", "consulter-absences", "valider-absences",
    "consulter-discipline", "prononcer-discipline",
    "consulter-affaires-sociales",
    "consulter-formations",
    "consulter-evaluations", "valider-evaluations",
  ],
  // admin = toutes les permissions
  admin: modules.flatMap((m) => m.gate?.anyPermission ?? []),
};

function ctxForRole(role: string, scopes: string[] = []): AccessContext {
  const perms = new Set(ROLE_PERMISSIONS[role] ?? []);
  return {
    can: (p) => perms.has(p),
    hasRole: (r) => r === role,
    hasScope: (s) => scopes.includes(s),
  };
}

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
