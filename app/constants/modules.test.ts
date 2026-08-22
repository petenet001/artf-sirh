import { describe, it, expect } from "vitest";
import {
  accessibleModules,
  canAccessModule,
  landingRoute,
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
  agent: ["consulter-referentiels", "consulter-conges", "creer-conges", "consulter-absences", "creer-absences"],
  "chef-service": [
    "consulter-structure",
    "consulter-referentiels",
    "consulter-agents",
    "consulter-conges",
    "valider-conges",
    "consulter-absences",
  ],
  rh: [
    "consulter-utilisateurs", "creer-utilisateurs", "modifier-utilisateurs",
    "consulter-structure", "consulter-referentiels", "creer-referentiels", "modifier-referentiels",
    "consulter-agents", "creer-agents", "modifier-agents",
    "consulter-recrutement", "creer-recrutement", "valider-recrutement",
    "consulter-contrats", "creer-contrats", "modifier-contrats",
    "consulter-conges", "valider-conges", "consulter-absences", "valider-absences",
    "consulter-evaluations", "consulter-reporting",
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
  it("agent simple : uniquement le module d'accueil, atterrit sur /mon-espace", () => {
    const ctx = ctxForRole("agent");
    expect(keys(ctx)).toEqual(["tableau-de-bord"]);
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
      expect.arrayContaining(["tableau-de-bord", "personnel", "integration", "administration"]),
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

  it("le profil reste rattaché au module sans être un onglet (pas de doublon)", () => {
    expect(moduleForPath("/profil")?.key).toBe("tableau-de-bord");
    expect(navTo(ctxForRole("admin", ["entite"]))).not.toContain("/profil");
  });
});

describe("moduleForPath", () => {
  it("résout le module d'une route métier", () => {
    expect(moduleForPath("/personnel/agents")?.key).toBe("personnel");
    expect(moduleForPath("/personnel/agents/12")?.key).toBe("personnel");
    expect(moduleForPath("/integration/dossiers")?.key).toBe("integration");
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
