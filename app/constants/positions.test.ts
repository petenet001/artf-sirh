import { describe, it, expect } from "vitest";
import { EFFET_POSITION, essaiOuvert, STATUT_ESSAI_LABEL } from "./positions";

describe("effets des positions (CCN art. 78–80)", () => {
  it("détachement et disponibilité coupent la rémunération, pas les autres", () => {
    expect(EFFET_POSITION.detachement).toContain("non maintenue");
    expect(EFFET_POSITION.disponibilite).toContain("suspendus");
    expect(EFFET_POSITION.position_exceptionnelle).toContain("maintenus");
    expect(EFFET_POSITION.sous_le_drapeau).toContain("maintenue");
  });
});

describe("essaiOuvert", () => {
  it("n'est vrai que tant que l'essai court", () => {
    expect(essaiOuvert({ statut: "en_cours" })).toBe(true);
    expect(essaiOuvert({ statut: "renouvele" })).toBe(true);
    expect(essaiOuvert({ statut: "concluant" })).toBe(false);
    expect(essaiOuvert({ statut: "rompu" })).toBe(false);
    expect(essaiOuvert({ statut: "non_applicable" })).toBe(false);
    expect(essaiOuvert(null)).toBe(false);
  });
});

describe("libellés d'essai", () => {
  it("couvrent tout l'enum backend", () => {
    expect(Object.keys(STATUT_ESSAI_LABEL)).toEqual([
      "en_cours",
      "renouvele",
      "concluant",
      "rompu",
      "non_applicable",
    ]);
  });
});
