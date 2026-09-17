import { describe, it, expect } from "vitest";
import { exigeQualiteAge, LIENS_PAR_TYPE, QUALITE_AGE_LABEL } from "./social";

describe("liens juridiques par type (CCN art. 59)", () => {
  it("le conjoint relève du mariage ou de l'union libre", () => {
    expect(LIENS_PAR_TYPE.conjoint).toEqual(["mariage", "union_libre"]);
  });

  it("l'enfant relève de la filiation, de l'adoption ou de la tutelle", () => {
    expect(LIENS_PAR_TYPE.enfant).toContain("naturel_reconnu");
    expect(LIENS_PAR_TYPE.enfant).toContain("tutelle");
    expect(LIENS_PAR_TYPE.enfant).not.toContain("union_libre");
  });
});

describe("exigeQualiteAge", () => {
  it("ne concerne que les enfants", () => {
    expect(exigeQualiteAge("enfant")).toBe(true);
    expect(exigeQualiteAge("conjoint")).toBe(false);
    expect(exigeQualiteAge(null)).toBe(false);
  });
});

describe("libellés des régimes d'âge", () => {
  it("rappellent l'âge limite de prise en charge", () => {
    expect(QUALITE_AGE_LABEL.standard).toContain("16");
    expect(QUALITE_AGE_LABEL.apprentissage).toContain("17");
    expect(QUALITE_AGE_LABEL.etudes).toContain("21");
    expect(QUALITE_AGE_LABEL.infirmite).toContain("21");
  });
});
