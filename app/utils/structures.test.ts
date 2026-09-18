import { describe, it, expect } from "vitest";
import {
  chaineStructure,
  libelleStructure,
  dansPerimetre,
  perimetreDepuisBureau,
  libellePerimetre,
  optionsStructure,
  perimetreSelectionne,
  TYPE_BUREAU,
  TYPE_SERVICE,
  TYPE_DIRECTION,
  type ReferentielsStructure,
} from "./structures";

/**
 * Organigramme de test, deux directions :
 *
 *   D.R.H.L ── S.R.H ── B.P (Personnel)
 *           │        └── B.S (Solde)
 *           └── S.F  ── B.F (Formation)
 *   D.R     ── S.A.R ── B.O (Ordonnancement)
 */
const REF: ReferentielsStructure = {
  directions: [
    { id: 1, nom: "Direction des RH et de la Logistique", sigle: "D.R.H.L" },
    { id: 2, nom: "Direction de la Régulation", sigle: "D.R" },
  ],
  services: [
    { id: 10, nom: "Service des RH", sigle: "S.R.H", direction_id: 1 },
    { id: 11, nom: "Service Formation", sigle: "S.F", direction_id: 1 },
    { id: 20, nom: "Service Administratif", sigle: "S.A.R", direction_id: 2 },
  ],
  bureaux: [
    { id: 100, nom: "Bureau du Personnel", sigle: "B.P", service_id: 10 },
    { id: 101, nom: "Bureau Solde", sigle: "B.S", service_id: 10 },
    { id: 110, nom: "Bureau Formation", sigle: "B.F", service_id: 11 },
    { id: 200, nom: "Bureau Ordonnancement", sigle: "B.O", service_id: 20 },
  ],
};

const auBureau = (id: number) => ({ structurable_type: TYPE_BUREAU, structurable_id: id });
const auService = (id: number) => ({ structurable_type: TYPE_SERVICE, structurable_id: id });
const aLaDirection = (id: number) => ({ structurable_type: TYPE_DIRECTION, structurable_id: id });

describe("chaineStructure", () => {
  it("remonte bureau → service → direction", () => {
    const c = chaineStructure(auBureau(100), REF);
    expect(c.bureau?.sigle).toBe("B.P");
    expect(c.service?.sigle).toBe("S.R.H");
    expect(c.direction?.sigle).toBe("D.R.H.L");
  });

  it("part du niveau réel : un agent affecté au service n'a pas de bureau", () => {
    const c = chaineStructure(auService(10), REF);
    expect(c.bureau).toBeUndefined();
    expect(c.service?.sigle).toBe("S.R.H");
    expect(c.direction?.sigle).toBe("D.R.H.L");
  });

  it("s'arrête à la direction quand l'affectation y est posée", () => {
    const c = chaineStructure(aLaDirection(2), REF);
    expect(c.direction?.sigle).toBe("D.R");
    expect(c.service).toBeUndefined();
  });

  it("rend une chaîne vide sans rattachement", () => {
    expect(chaineStructure(null, REF)).toEqual({});
    expect(chaineStructure({ structurable_type: null, structurable_id: null }, REF)).toEqual({});
  });

  it("ne casse pas sur un référentiel incomplet", () => {
    expect(chaineStructure(auBureau(999), REF)).toEqual({
      bureau: undefined,
      service: undefined,
      direction: undefined,
    });
  });
});

describe("libelleStructure", () => {
  it("écrit la chaîne du plus large au plus précis", () => {
    expect(libelleStructure(auBureau(101), REF)).toBe("D.R.H.L · S.R.H · B.S");
  });

  it("n'écrit que ce qui existe", () => {
    expect(libelleStructure(auService(20), REF)).toBe("D.R · S.A.R");
    expect(libelleStructure(aLaDirection(1), REF)).toBe("D.R.H.L");
  });

  it("dit « non affecté » seulement quand il n'y a vraiment rien", () => {
    expect(libelleStructure(null, REF)).toBe("Non affecté");
  });

  it("n'affirme pas « non affecté » quand le référentiel n'est pas encore chargé", () => {
    // L'agent EST affecté ; c'est nous qui ne savons pas encore où.
    expect(libelleStructure(auBureau(100), { directions: [], services: [], bureaux: [] })).toBe("…");
  });

  it("retombe sur le nom quand la structure n'a pas de sigle", () => {
    const ref: ReferentielsStructure = {
      directions: [],
      services: [],
      bureaux: [{ id: 1, nom: "Bureau sans sigle", sigle: null }],
    };
    expect(libelleStructure(auBureau(1), ref)).toBe("Bureau sans sigle");
  });
});

describe("dansPerimetre — miroir de `scopeMaStructure`", () => {
  it("périmètre bureau : ce bureau et lui seul", () => {
    const p = { type: TYPE_BUREAU, id: 100 };
    expect(dansPerimetre(auBureau(100), p, REF)).toBe(true);
    // Bureau voisin du même service : dehors.
    expect(dansPerimetre(auBureau(101), p, REF)).toBe(false);
    // Affecté au service parent : dehors aussi — il n'est pas dans ce bureau.
    expect(dansPerimetre(auService(10), p, REF)).toBe(false);
  });

  it("périmètre service : le service ET tous ses bureaux", () => {
    const p = { type: TYPE_SERVICE, id: 10 };
    expect(dansPerimetre(auService(10), p, REF)).toBe(true);
    expect(dansPerimetre(auBureau(100), p, REF)).toBe(true);
    expect(dansPerimetre(auBureau(101), p, REF)).toBe(true);
    // Bureau d'un autre service de la même direction : dehors.
    expect(dansPerimetre(auBureau(110), p, REF)).toBe(false);
  });

  it("périmètre direction : la direction, ses services et leurs bureaux", () => {
    const p = { type: TYPE_DIRECTION, id: 1 };
    expect(dansPerimetre(aLaDirection(1), p, REF)).toBe(true);
    expect(dansPerimetre(auService(11), p, REF)).toBe(true);
    expect(dansPerimetre(auBureau(110), p, REF)).toBe(true);
    expect(dansPerimetre(auBureau(100), p, REF)).toBe(true);
    // Autre direction : dehors.
    expect(dansPerimetre(auBureau(200), p, REF)).toBe(false);
  });

  it("sans périmètre, tout passe", () => {
    expect(dansPerimetre(auBureau(200), null, REF)).toBe(true);
    expect(dansPerimetre(null, null, REF)).toBe(true);
  });

  it("exclut un agent sans affectation d'un périmètre donné", () => {
    expect(dansPerimetre(null, { type: TYPE_SERVICE, id: 10 }, REF)).toBe(false);
  });
});

describe("perimetreDepuisBureau", () => {
  it("rend le bureau tel quel au niveau bureau", () => {
    expect(perimetreDepuisBureau(100, "bureau", REF)).toEqual({ type: TYPE_BUREAU, id: 100 });
  });

  it("remonte au service, puis à la direction", () => {
    expect(perimetreDepuisBureau(100, "service", REF)).toEqual({ type: TYPE_SERVICE, id: 10 });
    expect(perimetreDepuisBureau(100, "direction", REF)).toEqual({ type: TYPE_DIRECTION, id: 1 });
  });

  it("ne rend rien plutôt qu'un périmètre faux si la filiation manque", () => {
    const orphelin: ReferentielsStructure = {
      directions: [],
      services: [],
      bureaux: [{ id: 5, nom: "Bureau orphelin", service_id: null }],
    };
    expect(perimetreDepuisBureau(5, "service", orphelin)).toBeNull();
    expect(perimetreDepuisBureau(5, "direction", orphelin)).toBeNull();
    // Le niveau bureau, lui, n'a besoin d'aucune filiation.
    expect(perimetreDepuisBureau(5, "bureau", orphelin)).toEqual({ type: TYPE_BUREAU, id: 5 });
  });

  it("rend `null` pour un compte sans rattachement", () => {
    expect(perimetreDepuisBureau(null, "service", REF)).toBeNull();
    expect(perimetreDepuisBureau(undefined, "bureau", REF)).toBeNull();
  });
});

describe("libellePerimetre", () => {
  it("nomme le périmètre pour l'étiquette du sélecteur", () => {
    expect(libellePerimetre({ type: TYPE_BUREAU, id: 100 }, REF)).toBe("B.P");
    expect(libellePerimetre({ type: TYPE_SERVICE, id: 20 }, REF)).toBe("S.A.R");
    expect(libellePerimetre({ type: TYPE_DIRECTION, id: 2 }, REF)).toBe("D.R");
  });

  it("rend `null` quand il n'y a rien à nommer", () => {
    expect(libellePerimetre(null, REF)).toBeNull();
    expect(libellePerimetre({ type: TYPE_BUREAU, id: 999 }, REF)).toBeNull();
  });
});

describe("optionsStructure — chacun ne parcourt que ce qu'il a en dessous", () => {
  const rien = {};

  it("chef de bureau : aucun niveau, donc aucun filtre à l'écran", () => {
    const o = optionsStructure({ type: TYPE_BUREAU, id: 100 }, rien, REF);
    expect(o).toEqual({ directions: [], services: [], bureaux: [] });
  });

  it("chef de service : ses bureaux, et rien au-dessus", () => {
    const o = optionsStructure({ type: TYPE_SERVICE, id: 10 }, rien, REF);
    expect(o.directions).toEqual([]);
    expect(o.services).toEqual([]);
    expect(o.bureaux.map((b) => b.sigle)).toEqual(["B.P", "B.S"]);
  });

  it("directeur : ses services, et tous leurs bureaux tant qu'aucun service n'est choisi", () => {
    const o = optionsStructure({ type: TYPE_DIRECTION, id: 1 }, rien, REF);
    // Pas de niveau « direction » : c'est la sienne, il n'y a rien à choisir.
    expect(o.directions).toEqual([]);
    expect(o.services.map((s) => s.sigle)).toEqual(["S.R.H", "S.F"]);
    expect(o.bureaux.map((b) => b.sigle)).toEqual(["B.P", "B.S", "B.F"]);
  });

  it("directeur : choisir un service restreint les bureaux offerts", () => {
    const o = optionsStructure({ type: TYPE_DIRECTION, id: 1 }, { serviceId: 11 }, REF);
    expect(o.bureaux.map((b) => b.sigle)).toEqual(["B.F"]);
  });

  it("vue globale : les trois niveaux, l'organigramme entier", () => {
    const o = optionsStructure(null, rien, REF);
    expect(o.directions.map((d) => d.sigle)).toEqual(["D.R.H.L", "D.R"]);
    expect(o.services).toHaveLength(3);
    expect(o.bureaux).toHaveLength(4);
  });

  it("vue globale : la direction choisie restreint services ET bureaux", () => {
    const o = optionsStructure(null, { directionId: 2 }, REF);
    expect(o.services.map((s) => s.sigle)).toEqual(["S.A.R"]);
    expect(o.bureaux.map((b) => b.sigle)).toEqual(["B.O"]);
  });

  it("vue globale : le service choisi l'emporte sur la direction pour les bureaux", () => {
    const o = optionsStructure(null, { directionId: 1, serviceId: 10 }, REF);
    expect(o.bureaux.map((b) => b.sigle)).toEqual(["B.P", "B.S"]);
  });
});

describe("perimetreSelectionne", () => {
  const racine = { type: TYPE_DIRECTION, id: 1 };

  it("retient le niveau le plus profond choisi", () => {
    expect(perimetreSelectionne(racine, { directionId: 1, serviceId: 10, bureauId: 100 }))
      .toEqual({ type: TYPE_BUREAU, id: 100 });
    expect(perimetreSelectionne(racine, { directionId: 1, serviceId: 10 }))
      .toEqual({ type: TYPE_SERVICE, id: 10 });
    expect(perimetreSelectionne(racine, { directionId: 2 }))
      .toEqual({ type: TYPE_DIRECTION, id: 2 });
  });

  it("retombe sur la racine quand rien n'est choisi", () => {
    expect(perimetreSelectionne(racine, {})).toEqual(racine);
    // Vue globale sans sélection : aucun filtre, tout l'effectif.
    expect(perimetreSelectionne(null, {})).toBeNull();
  });
});

describe("le filtre reste dans les clous de ce que le serveur a déjà envoyé", () => {
  it("un chef de service qui descend sur un bureau ne voit que ce bureau", () => {
    const racine = { type: TYPE_SERVICE, id: 10 };
    const p = perimetreSelectionne(racine, { bureauId: 101 });
    expect(dansPerimetre(auBureau(101), p, REF)).toBe(true);
    expect(dansPerimetre(auBureau(100), p, REF)).toBe(false);
    // Et l'agent rattaché au service lui-même sort du filtre « bureau » :
    // il n'est dans aucun des deux bureaux, ce qui est exact.
    expect(dansPerimetre(auService(10), p, REF)).toBe(false);
  });

  it("sans descente, il revoit son service entier", () => {
    const racine = { type: TYPE_SERVICE, id: 10 };
    const p = perimetreSelectionne(racine, {});
    expect(dansPerimetre(auBureau(100), p, REF)).toBe(true);
    expect(dansPerimetre(auBureau(101), p, REF)).toBe(true);
    expect(dansPerimetre(auService(10), p, REF)).toBe(true);
  });
});
