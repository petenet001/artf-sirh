import { describe, it, expect } from "vitest";
import {
  arbreVide,
  court,
  dansPerimetre,
  directionDuService,
  indexerNoms,
  libelleStructure,
  optionsNiveau,
  perimetreSelectionne,
  serviceDuBureau,
  TOUTES_STRUCTURES,
  TYPE_BUREAU,
  TYPE_DIRECTION,
  TYPE_SERVICE,
  type ArbreConnu,
} from "./structures";

/**
 * Organigramme de test :
 *
 *   D.R.H.L (1) ── S.R.H (10) ── B.P (100)
 *               │             └─ B.S (101)
 *               └─ S.F  (11) ── B.F (110)
 *   D.R     (2) ── S.A.R (20) ── B.O (200)
 */
const DIRECTIONS = [
  { id: 1, nom: "Direction des RH et de la Logistique", sigle: "D.R.H.L" },
  { id: 2, nom: "Direction de la Régulation", sigle: "D.R" },
];
const SERVICES = [
  { id: 10, nom: "Service des RH", sigle: "S.R.H" },
  { id: 11, nom: "Service Formation", sigle: "S.F" },
  { id: 20, nom: "Service Administratif", sigle: "S.A.R" },
];
const BUREAUX = [
  { id: 100, nom: "Bureau du Personnel", sigle: "B.P" },
  { id: 101, nom: "Bureau Solde", sigle: "B.S" },
  { id: 110, nom: "Bureau Formation", sigle: "B.F" },
  { id: 200, nom: "Bureau Ordonnancement", sigle: "B.O" },
];

const NOMS = indexerNoms(DIRECTIONS, SERVICES, BUREAUX);

/** Arbre entièrement chargé — le cas où toutes les branches ont été parcourues. */
function arbreComplet(): ArbreConnu {
  return {
    directions: DIRECTIONS,
    servicesParDirection: new Map([
      [1, [SERVICES[0]!, SERVICES[1]!]],
      [2, [SERVICES[2]!]],
    ]),
    bureauxParService: new Map([
      [10, [BUREAUX[0]!, BUREAUX[1]!]],
      [11, [BUREAUX[2]!]],
      [20, [BUREAUX[3]!]],
    ]),
  };
}

const auBureau = (id: number) => ({ structurable_type: TYPE_BUREAU, structurable_id: id });
const auService = (id: number) => ({ structurable_type: TYPE_SERVICE, structurable_id: id });
const aLaDirection = (id: number) => ({ structurable_type: TYPE_DIRECTION, structurable_id: id });

describe("court", () => {
  it("préfère le sigle au nom", () => {
    expect(court({ id: 1, nom: "Direction des RH", sigle: "D.R.H.L" })).toBe("D.R.H.L");
  });

  it("retombe sur le nom sans sigle, et rend une chaîne vide sans structure", () => {
    expect(court({ id: 1, nom: "Sans sigle", sigle: null })).toBe("Sans sigle");
    expect(court(null)).toBe("");
  });
});

describe("libelleStructure — nommer d'abord, situer si on peut", () => {
  it("nomme le niveau réel dès que les listes plates sont là, sans filiation", () => {
    // C'est le cas au chargement : on connaît les noms, pas encore les parents.
    expect(libelleStructure(auBureau(100), NOMS)).toBe("B.P");
    expect(libelleStructure(auService(10), NOMS)).toBe("S.R.H");
    expect(libelleStructure(aLaDirection(1), NOMS)).toBe("D.R.H.L");
  });

  it("préfixe des parents une fois la branche chargée", () => {
    const a = arbreComplet();
    expect(libelleStructure(auBureau(100), NOMS, a)).toBe("D.R.H.L · S.R.H · B.P");
    expect(libelleStructure(auService(11), NOMS, a)).toBe("D.R.H.L · S.F");
  });

  it("s'arrête au parent connu quand la branche n'est chargée qu'à moitié", () => {
    // Bureaux d'un service chargés, mais on ignore de quelle direction il relève.
    const partiel: ArbreConnu = {
      directions: DIRECTIONS,
      servicesParDirection: new Map(),
      bureauxParService: new Map([[10, [BUREAUX[0]!]]]),
    };
    expect(libelleStructure(auBureau(100), NOMS, partiel)).toBe("S.R.H · B.P");
  });

  it("dit « Non affecté » seulement quand il n'y a vraiment rien", () => {
    expect(libelleStructure(null, NOMS)).toBe("Non affecté");
    expect(libelleStructure({ structurable_type: null, structurable_id: null }, NOMS)).toBe("Non affecté");
  });

  it("n'efface pas un agent dont la structure est inconnue du référentiel", () => {
    // Mieux vaut « Bureau nº 999 » qu'un vide qui ferait croire à une absence
    // d'affectation.
    expect(libelleStructure(auBureau(999), NOMS)).toBe("Bureau nº 999");
  });
});

describe("dansPerimetre — miroir de `scopeMaStructure`", () => {
  const arbre = arbreComplet();

  it("périmètre bureau : ce bureau et lui seul", () => {
    const p = { type: TYPE_BUREAU, id: 100 };
    expect(dansPerimetre(auBureau(100), p, arbre)).toBe(true);
    expect(dansPerimetre(auBureau(101), p, arbre)).toBe(false);
    // Affecté au service parent : dehors — il n'est pas dans ce bureau.
    expect(dansPerimetre(auService(10), p, arbre)).toBe(false);
  });

  it("périmètre service : le service ET tous ses bureaux", () => {
    const p = { type: TYPE_SERVICE, id: 10 };
    expect(dansPerimetre(auService(10), p, arbre)).toBe(true);
    expect(dansPerimetre(auBureau(100), p, arbre)).toBe(true);
    expect(dansPerimetre(auBureau(101), p, arbre)).toBe(true);
    // Bureau d'un autre service de la même direction : dehors.
    expect(dansPerimetre(auBureau(110), p, arbre)).toBe(false);
  });

  it("périmètre direction : la direction, ses services et leurs bureaux", () => {
    const p = { type: TYPE_DIRECTION, id: 1 };
    expect(dansPerimetre(aLaDirection(1), p, arbre)).toBe(true);
    expect(dansPerimetre(auService(11), p, arbre)).toBe(true);
    expect(dansPerimetre(auBureau(110), p, arbre)).toBe(true);
    expect(dansPerimetre(auBureau(100), p, arbre)).toBe(true);
    expect(dansPerimetre(auBureau(200), p, arbre)).toBe(false);
  });

  it("sans périmètre, tout passe", () => {
    expect(dansPerimetre(auBureau(200), null, arbre)).toBe(true);
    expect(dansPerimetre(null, null, arbre)).toBe(true);
  });

  it("exclut un agent sans affectation d'un périmètre donné", () => {
    expect(dansPerimetre(null, { type: TYPE_SERVICE, id: 10 }, arbre)).toBe(false);
  });

  it("exclut plutôt que d'inclure à tort quand la branche n'est pas chargée", () => {
    // Un filtre qui laisse passer ce qu'il ne sait pas vérifier ne filtre rien.
    // La liste paraîtra courte — ce que l'utilisateur voit et corrige — plutôt
    // que fausse, ce qu'il ne verrait pas.
    const vide = arbreVide();
    expect(dansPerimetre(auBureau(100), { type: TYPE_SERVICE, id: 10 }, vide)).toBe(false);
    // Le niveau exact, lui, reste vérifiable sans arbre.
    expect(dansPerimetre(auService(10), { type: TYPE_SERVICE, id: 10 }, vide)).toBe(true);
  });
});

describe("filiation connue", () => {
  const arbre = arbreComplet();

  it("retrouve le service d'un bureau et la direction d'un service", () => {
    expect(serviceDuBureau(101, arbre, NOMS)?.sigle).toBe("S.R.H");
    expect(directionDuService(11, arbre, NOMS)?.sigle).toBe("D.R.H.L");
  });

  it("rend `null` pour une branche non chargée, jamais une approximation", () => {
    expect(serviceDuBureau(100, arbreVide(), NOMS)).toBeNull();
    expect(directionDuService(10, arbreVide(), NOMS)).toBeNull();
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

describe("optionsNiveau", () => {
  it("place « tous » en tête avec une valeur sélectionnable", () => {
    const o = optionsNiveau(SERVICES, "Tous les services");
    // `SelectItem` exige une valeur : sans elle, on descendrait sans remonter.
    expect(o[0]).toEqual({ label: "Tous les services", value: TOUTES_STRUCTURES });
    expect(o[0]!.value).toBeDefined();
  });

  it("écrit sigle et nom, et retombe sur le nom seul", () => {
    expect(optionsNiveau([SERVICES[0]!], "Tous")[1]!.label).toBe("S.R.H — Service des RH");
    expect(optionsNiveau([{ id: 9, nom: "Sans sigle" }], "Tous")[1]!.label).toBe("Sans sigle");
  });

  it("n'entre en collision avec aucune structure réelle", () => {
    const ids = [...DIRECTIONS, ...SERVICES, ...BUREAUX].map((s) => s.id);
    expect(ids).not.toContain(TOUTES_STRUCTURES);
  });
});

describe("le filtre client ne retranche jamais le périmètre du serveur", () => {
  /**
   * Le bug qu'on a corrigé : le périmètre de l'utilisateur était appliqué comme
   * filtre par défaut. Au premier rendu, la filiation n'étant pas chargée, il
   * retombait sur le niveau le plus restrictif — **un directeur ne voyait que
   * son bureau** au lieu de sa direction, alors que le serveur lui avait bien
   * envoyé toute sa direction.
   *
   * La règle : sans descente choisie, aucun filtre. Le serveur a déjà cadré.
   */
  const agents = [
    { affectation_active: auBureau(100) },
    { affectation_active: auBureau(101) },
    { affectation_active: auBureau(110) },
    { affectation_active: auService(10) },
    { affectation_active: null },
  ];

  const filtrer = (p: ReturnType<typeof perimetreSelectionne>, arbre = arbreComplet()) =>
    agents.filter((a) => dansPerimetre(a.affectation_active, p, arbre));

  it("laisse tout passer quand aucune descente n'est choisie", () => {
    // Y compris l'agent sans affectation : le serveur l'a envoyé, il compte.
    expect(filtrer(null)).toHaveLength(agents.length);
  });

  it("ne retranche que ce que la descente choisie exclut", () => {
    expect(filtrer({ type: TYPE_SERVICE, id: 10 })).toHaveLength(3); // B.P, B.S, S.R.H
    expect(filtrer({ type: TYPE_BUREAU, id: 100 })).toHaveLength(1);
  });

  it("un périmètre de direction couvre bien les bureaux de ses services", () => {
    // C'est précisément ce que la version fautive ratait.
    expect(filtrer({ type: TYPE_DIRECTION, id: 1 })).toHaveLength(4);
  });
});
