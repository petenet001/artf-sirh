import { describe, it, expect } from "vitest";
import {
  RACINE_ARTF,
  aplatirEffectif,
  compterStructures,
  construireArbre,
  idsAgents,
  type AffectationAgent,
} from "./entite";
import { TYPE_BUREAU, TYPE_DIRECTION, TYPE_SERVICE, type ArbreConnu } from "./structures";

const DRHL = { id: 4, nom: "Direction RH et logistique", sigle: "D.R.H.L" };
const DF = { id: 2, nom: "Direction financière", sigle: "D.F" };
const SP = { id: 11, nom: "Service du personnel", sigle: "S.P" };
const SL = { id: 12, nom: "Service logistique", sigle: "S.L" };
const BP = { id: 30, nom: "Bureau de la paie", sigle: "B.P" };
const BC = { id: 31, nom: "Bureau des carrières", sigle: "B.C" };

const filiation: ArbreConnu = {
  directions: [DF, DRHL],
  servicesParDirection: new Map([
    [DRHL.id, [SP, SL]],
    [DF.id, []],
  ]),
  bureauxParService: new Map([
    [SP.id, [BP, BC]],
    [SL.id, []],
  ]),
};

let seq = 0;
function aff(type: string, id: number, nom: string): AffectationAgent {
  seq += 1;
  return {
    structurable_type: type,
    structurable_id: id,
    agent: { id: seq, nom, prenom: "A", matricule: `M${seq}` },
  };
}

const affectations: AffectationAgent[] = [
  aff(TYPE_DIRECTION, DRHL.id, "Directeur"),
  aff(TYPE_SERVICE, SP.id, "Chef SP"),
  aff(TYPE_BUREAU, BP.id, "Paie 1"),
  aff(TYPE_BUREAU, BP.id, "Paie 2"),
  aff(TYPE_BUREAU, BC.id, "Carriere"),
  aff(TYPE_SERVICE, SL.id, "Logistique"),
  // Hors DRHL : ne doit jamais apparaître sous elle.
  aff(TYPE_DIRECTION, DF.id, "Financier"),
];

describe("construireArbre", () => {
  it("donne au directeur toute sa direction, bureaux compris", () => {
    const arbre = construireArbre({ type: TYPE_DIRECTION, structure: DRHL }, filiation, affectations);

    expect(arbre.agents.map((a) => a.nom)).toEqual(["Directeur"]);
    expect(arbre.enfants.map((e) => e.sigle)).toEqual(["S.P", "S.L"]);
    expect(arbre.enfants[0]!.enfants.map((e) => e.total)).toEqual([2, 1]);
    expect(arbre.total).toBe(6);
  });

  it("limite le chef de service à son service et ses bureaux", () => {
    const arbre = construireArbre({ type: TYPE_SERVICE, structure: SP }, filiation, affectations);
    expect(arbre.total).toBe(4);
    expect(arbre.enfants.map((e) => e.sigle)).toEqual(["B.P", "B.C"]);
  });

  it("limite le chef de bureau à son bureau", () => {
    const arbre = construireArbre({ type: TYPE_BUREAU, structure: BP }, filiation, affectations);
    expect(arbre.total).toBe(2);
    expect(arbre.enfants).toEqual([]);
  });

  it("donne au DG toute l'ARTF", () => {
    const arbre = construireArbre({ type: "artf", structure: RACINE_ARTF }, filiation, affectations);
    expect(arbre.agents).toEqual([]);
    expect(arbre.total).toBe(7);
    expect(compterStructures(arbre, TYPE_DIRECTION)).toBe(2);
    expect(compterStructures(arbre, TYPE_SERVICE)).toBe(2);
    expect(compterStructures(arbre, TYPE_BUREAU)).toBe(2);
  });

  it("ne compte un agent qu'une fois par structure", () => {
    const doublon = { ...affectations[0]! };
    const arbre = construireArbre({ type: TYPE_DIRECTION, structure: DRHL }, filiation, [...affectations, doublon]);
    expect(arbre.agents).toHaveLength(1);
  });
});

describe("aplatirEffectif", () => {
  it("liste tout l'effectif avec le chemin de sa structure", () => {
    const arbre = construireArbre({ type: TYPE_DIRECTION, structure: DRHL }, filiation, affectations);
    const lignes = aplatirEffectif(arbre);

    expect(lignes).toHaveLength(6);
    expect(lignes.find((l) => l.nom_complet === "A Paie 1")?.structure).toBe("D.R.H.L · S.P · B.P");
    expect(lignes.find((l) => l.nom_complet === "A Directeur")?.structure).toBe("D.R.H.L");
  });

  it("n'ajoute pas l'ARTF au chemin du DG", () => {
    const arbre = construireArbre({ type: "artf", structure: RACINE_ARTF }, filiation, affectations);
    expect(aplatirEffectif(arbre).find((l) => l.nom_complet === "A Financier")?.structure).toBe("D.F");
  });
});

describe("idsAgents", () => {
  it("rassemble les agents de toute la descendance", () => {
    const arbre = construireArbre({ type: TYPE_SERVICE, structure: SP }, filiation, affectations);
    expect(idsAgents(arbre).size).toBe(4);
  });
});
