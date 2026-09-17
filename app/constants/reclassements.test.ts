import { describe, it, expect } from "vitest";
import { CHAMPS_PAR_TYPE, peutApprouver } from "./reclassements";

describe("CHAMPS_PAR_TYPE", () => {
  it("art. 73 : le diplôme, et lui seul", () => {
    expect(CHAMPS_PAR_TYPE.reclassement_formation).toEqual({
      diplome: true,
      classeCible: false,
      fonctionCible: false,
      motifReconversion: false,
    });
  });

  it("art. 74a : une classe cible ; 74b : rien à saisir", () => {
    expect(CHAMPS_PAR_TYPE.reclassement_exceptionnel.classeCible).toBe(true);
    expect(Object.values(CHAMPS_PAR_TYPE.hors_classe).every((v) => v === false)).toBe(true);
  });

  it("art. 75 : motif réglementaire et fonction de reconversion", () => {
    expect(CHAMPS_PAR_TYPE.reconversion.motifReconversion).toBe(true);
    expect(CHAMPS_PAR_TYPE.reconversion.fonctionCible).toBe(true);
  });
});

describe("peutApprouver", () => {
  const rh = { estRh: true, estDg: false, estAdmin: false };
  const dg = { estRh: false, estDg: true, estAdmin: false };
  const admin = { estRh: false, estDg: false, estAdmin: true };

  it("art. 73 : la RH approuve, pas le DG", () => {
    expect(peutApprouver("reclassement_formation", rh)).toBe(true);
    expect(peutApprouver("reclassement_formation", dg)).toBe(false);
  });

  it("art. 74 et 75 : le DG approuve, pas la RH", () => {
    for (const type of ["reclassement_exceptionnel", "hors_classe", "reconversion"] as const) {
      expect(peutApprouver(type, dg)).toBe(true);
      expect(peutApprouver(type, rh)).toBe(false);
    }
  });

  it("admin passe partout", () => {
    expect(peutApprouver("reclassement_formation", admin)).toBe(true);
    expect(peutApprouver("reconversion", admin)).toBe(true);
  });
});
