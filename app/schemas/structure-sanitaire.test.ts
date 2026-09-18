import { describe, it, expect } from "vitest";
import { structureSanitaireSchema, structureSanitaireInputSchema } from "./structure-sanitaire";

describe("structureSanitaireSchema", () => {
  it("valide une structure agréée", () => {
    const s = structureSanitaireSchema.parse({
      id: 1,
      nom: "Clinique Guénin",
      type: "formation_sanitaire",
      type_label: "Formation sanitaire",
      ville: "Brazzaville",
      actif: true,
    });
    expect(s.type).toBe("formation_sanitaire");
  });

  it("accepte une structure désactivée : les dossiers passés doivent rester lisibles", () => {
    expect(structureSanitaireSchema.parse({ id: 2, nom: "Optique X", type: "opticien", actif: false }).actif).toBe(false);
  });

  it("refuse un type hors référentiel", () => {
    expect(() => structureSanitaireSchema.parse({ id: 3, nom: "Labo", type: "laboratoire" })).toThrow();
  });
});

describe("structureSanitaireInputSchema", () => {
  it("exige un nom et un type", () => {
    expect(() => structureSanitaireInputSchema.parse({ nom: "", type: "pharmacie" })).toThrow();
    expect(() => structureSanitaireInputSchema.parse({ nom: "Pharmacie du Centre" })).toThrow();
  });

  it("valide une saisie minimale", () => {
    expect(structureSanitaireInputSchema.parse({ nom: "Pharmacie du Centre", type: "pharmacie" }).nom)
      .toBe("Pharmacie du Centre");
  });
});
