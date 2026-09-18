import { describe, it, expect } from "vitest";
import {
  familleRole,
  libelleRole,
  niveauCloisonnement,
  descriptionPerimetre,
  nomsRoles,
  COULEUR_FAMILLE_ROLE,
  LIBELLE_ROLE,
  domainePermission,
  verbePermission,
  grouperPermissions,
  libelleDomaine,
  vueEffective,
} from "./utilisateurs";
import { ROLES_RH } from "./roles";

describe("familleRole", () => {
  it("range les six rôles RH, bureaux compris, dans la famille RH", () => {
    for (const role of ROLES_RH) {
      expect(familleRole(role)).toBe("rh");
    }
  });

  it("distingue le système, la hiérarchie et l'agent", () => {
    expect(familleRole("admin")).toBe("systeme");
    expect(familleRole("directeur-general")).toBe("hierarchie");
    expect(familleRole("chef-bureau")).toBe("hierarchie");
    expect(familleRole("agent")).toBe("agent");
  });

  it("classe un rôle inconnu en agent plutôt que de planter", () => {
    expect(familleRole("stagiaire-externe")).toBe("agent");
    expect(COULEUR_FAMILLE_ROLE[familleRole("stagiaire-externe")]).toBe("neutral");
  });
});

describe("libelleRole", () => {
  it("rend lisibles les rôles de bureau, illisibles tels quels", () => {
    expect(libelleRole("rh-affaires-sociales")).toBe("Bureau Affaires sociales");
    expect(libelleRole("rh-etude")).toBe("Bureau Étude et Planification");
  });

  it("couvre tous les rôles du seeder", () => {
    for (const role of ROLES_RH) expect(LIBELLE_ROLE[role]).toBeTruthy();
  });

  it("retombe sur le nom technique pour un rôle non répertorié", () => {
    expect(libelleRole("role-futur")).toBe("role-futur");
  });
});

describe("niveauCloisonnement", () => {
  it("suit la fonction, comme `User::niveauCloisonnement()` côté serveur", () => {
    expect(niveauCloisonnement(["directeur"])).toBe("direction");
    expect(niveauCloisonnement(["directeur-general"])).toBe("direction");
    expect(niveauCloisonnement(["chef-service"])).toBe("service");
    expect(niveauCloisonnement(["chef-bureau"])).toBe("bureau");
    expect(niveauCloisonnement(["agent"])).toBe("bureau");
  });

  it("retient le niveau le plus large quand les rôles se cumulent", () => {
    // Un directeur DRHL porte `directeur` + `rh` : il voit sa direction.
    expect(niveauCloisonnement(["directeur", "rh"])).toBe("direction");
    // Un chef de bureau du B.F porte `chef-bureau` + `rh-formation`.
    expect(niveauCloisonnement(["chef-bureau", "rh-formation"])).toBe("bureau");
  });

  it("retombe sur le bureau, le plus restrictif, si aucun rôle ne décide", () => {
    expect(niveauCloisonnement([])).toBe("bureau");
  });
});

describe("descriptionPerimetre", () => {
  it("dit explicitement qu'un compte sans bureau voit tout", () => {
    expect(descriptionPerimetre({ vue_personnel: "globale", bureau_id: null })).toContain(
      "aucun cloisonnement",
    );
  });

  it("nomme le niveau réel pour un compte cloisonné", () => {
    expect(descriptionPerimetre({ vue_personnel: "service", bureau_id: 4 })).toContain("son service");
    expect(descriptionPerimetre({ vue_personnel: "direction", bureau_id: 4 })).toContain("sa direction");
    expect(descriptionPerimetre({ vue_personnel: "bureau", bureau_id: 4 })).toContain("son bureau");
  });

  it("n'annonce pas une restriction que le compte ne subit pas", () => {
    // Le piège introduit par `consulter-agents-global` : rattaché à un bureau,
    // mais vue globale. Déduire du seul rattachement ferait mentir l'écran.
    const texte = descriptionPerimetre({ vue_personnel: "globale", bureau_id: 5 });
    expect(texte).toContain("ne le restreint pas");
    expect(texte).not.toContain("son bureau");
  });
});

describe("vueEffective", () => {
  it("fait confiance au champ serveur avant toute déduction", () => {
    expect(vueEffective({ vue_personnel: "globale", bureau_id: 5, roles: [{ name: "agent" }] })).toBe(
      "globale",
    );
  });

  it("retombe sur la fonction quand l'API ne renvoie pas le champ", () => {
    expect(vueEffective({ bureau_id: 4, roles: [{ name: "chef-service" }] })).toBe("service");
    expect(vueEffective({ bureau_id: 4, roles: [{ name: "directeur" }] })).toBe("direction");
    expect(vueEffective({ bureau_id: 4, roles: [{ name: "agent" }] })).toBe("bureau");
  });

  it("traite l'absence de bureau comme une vue globale", () => {
    expect(vueEffective({ bureau_id: null, roles: [{ name: "rh" }] })).toBe("globale");
    expect(vueEffective({ roles: [] })).toBe("globale");
  });
});

describe("nomsRoles", () => {
  it("rend tous les rôles, pas seulement le premier", () => {
    // Le piège que la note backend §2k signale explicitement.
    expect(nomsRoles({ roles: [{ name: "rh" }, { name: "directeur" }] })).toEqual([
      "directeur",
      "rh",
    ]);
  });

  it("supporte un compte sans rôle", () => {
    expect(nomsRoles({})).toEqual([]);
    expect(nomsRoles({ roles: null })).toEqual([]);
  });
});

describe("groupement des permissions", () => {
  it("dérive le domaine du nom, sans table à maintenir", () => {
    expect(domainePermission("valider-conges")).toBe("conges");
    expect(domainePermission("consulter-affaires-sociales")).toBe("affaires-sociales");
    expect(domainePermission("gerer-salaires")).toBe("salaires");
    expect(domainePermission("acces-bureau-solde")).toBe("bureau-solde");
  });

  it("rend le nom entier si la permission ne suit pas la convention", () => {
    expect(domainePermission("permission-exotique")).toBe("permission-exotique");
    expect(verbePermission("permission-exotique")).toBeNull();
  });

  it("isole le verbe", () => {
    expect(verbePermission("prononcer-discipline")).toBe("prononcer");
    expect(verbePermission("decider-prestations")).toBe("decider");
  });

  it("regroupe et trie, domaines comme permissions", () => {
    const groupes = grouperPermissions([
      { id: 3, name: "valider-conges" },
      { id: 1, name: "consulter-agents" },
      { id: 2, name: "consulter-conges" },
    ]);
    expect(groupes.map((g) => g.domaine)).toEqual(["agents", "conges"]);
    expect(groupes[1]!.permissions.map((p) => p.name)).toEqual([
      "consulter-conges",
      "valider-conges",
    ]);
  });

  it("met en forme le libellé d'un domaine composé", () => {
    expect(libelleDomaine("affaires-sociales")).toBe("Affaires sociales");
    expect(libelleDomaine("conges")).toBe("Conges");
  });
});
