import { describe, it, expect } from "vitest";
import type { Sanction } from "~/schemas/sanction";
import type { ActeurDiscipline } from "./discipline";
import { actionsSanction, exigeIndemnite, exigeNbJours, peutJoindrePiece } from "./discipline";

/**
 * Cœur de la conformité CCN (art. 90–91) : la RH instruit **sans** prononcer,
 * le DG prononce **sans** instruire. Le front ne doit jamais proposer l'action
 * de l'autre.
 */
function dossier(over: Partial<Sanction> = {}): Sanction {
  return {
    id: 1,
    agent_id: 5,
    type_sanction_id: 3,
    statut: "en_attente",
    prochaine_etape: "instruire",
    created_by: 40,
    ...over,
  } as Sanction;
}

const rh: ActeurDiscipline = {
  peutConsulter: true,
  peutGerer: true,
  peutProposer: true,
  peutPrononcer: false,
  userId: 10,
};
const dg: ActeurDiscipline = {
  peutConsulter: true,
  peutGerer: false,
  peutProposer: false,
  peutPrononcer: true,
  userId: 20,
};
const chef: ActeurDiscipline = {
  peutConsulter: false,
  peutGerer: false,
  peutProposer: true,
  peutPrononcer: false,
  userId: 40,
};

const keys = (d: Sanction, a: ActeurDiscipline) => actionsSanction(d, a).map((x) => x.key);

describe("actionsSanction", () => {
  it("rapport déposé : la RH instruit, le DG n'a rien à faire", () => {
    expect(keys(dossier(), rh)).toContain("instruire");
    expect(keys(dossier(), dg)).not.toContain("instruire");
    expect(keys(dossier(), dg)).toEqual([]);
  });

  it("dossier instruit : le DG prononce ou classe, la RH ne peut plus rien", () => {
    const instruit = dossier({ statut: "instruite", prochaine_etape: "prononcer" });
    expect(keys(instruit, dg)).toEqual(["prononcer", "classer"]);
    expect(keys(instruit, rh)).toEqual([]);
  });

  it("l'auteur du rapport peut le supprimer tant qu'il n'est pas instruit (art. 91)", () => {
    expect(keys(dossier(), chef)).toEqual(["supprimer"]);
    expect(keys(dossier({ statut: "instruite", prochaine_etape: "prononcer" }), chef)).toEqual([]);
    expect(keys(dossier({ statut: "validee", prochaine_etape: null }), rh)).toEqual([]);
  });

  it("un chef ne supprime pas le rapport d'un autre", () => {
    const autreChef: ActeurDiscipline = { ...chef, userId: 99 };
    expect(keys(dossier(), autreChef)).toEqual([]);
  });
});

describe("peutJoindrePiece", () => {
  it("l'auteur joint avant l'instruction, la RH à tout moment", () => {
    expect(peutJoindrePiece(dossier(), chef)).toBe(true);
    expect(peutJoindrePiece(dossier({ statut: "instruite" }), chef)).toBe(false);
    expect(peutJoindrePiece(dossier({ statut: "validee" }), rh)).toBe(true);
  });

  it("le DG ne dépose pas de pièce", () => {
    expect(peutJoindrePiece(dossier(), dg)).toBe(false);
  });
});

describe("champs conditionnés par le type", () => {
  it("la mise à pied exige une durée", () => {
    expect(exigeNbJours({ exige_nb_jours: true })).toBe(true);
    expect(exigeNbJours({ code: "mise_a_pied" })).toBe(true);
    expect(exigeNbJours({ code: "blame_ecrit" })).toBe(false);
    expect(exigeNbJours(null)).toBe(false);
  });

  it("l'indemnité ne concerne que le licenciement", () => {
    expect(exigeIndemnite({ code: "licenciement" })).toBe(true);
    expect(exigeIndemnite({ code: "mise_a_pied" })).toBe(false);
  });
});
