import { describe, it, expect } from "vitest";
import { typeSanctionSchema, typeSanctionInputSchema } from "./type-sanction";

describe("typeSanctionSchema", () => {
  const valid = {
    id: 3,
    nom: "Mise à pied sans rémunération",
    code: "mise_a_pied",
    gravite: "grave",
    gravite_label: "Grave",
    exige_nb_jours: true,
    nb_jours_min: 1,
    nb_jours_max: 8,
    actif: true,
  };

  it("valide un type CCN", () => {
    expect(typeSanctionSchema.parse(valid).code).toBe("mise_a_pied");
  });

  it("accepte un type hors CCN (code null)", () => {
    expect(typeSanctionSchema.parse({ ...valid, code: null, nom: "Mutation d'office" }).code).toBeNull();
  });

  it("rejette un code ou une gravité hors enum", () => {
    expect(() => typeSanctionSchema.parse({ ...valid, code: "exclusion" })).toThrow();
    expect(() => typeSanctionSchema.parse({ ...valid, gravite: "critique" })).toThrow();
  });
});

describe("typeSanctionInputSchema", () => {
  it("borne les durées à 8 jours", () => {
    const base = { nom: "Mise à pied", gravite: "grave" as const };
    expect(typeSanctionInputSchema.parse({ ...base, nb_jours_max: 8 }).nb_jours_max).toBe(8);
    expect(() => typeSanctionInputSchema.parse({ ...base, nb_jours_max: 10 })).toThrow();
  });

  it("exige un nom et une gravité", () => {
    expect(() => typeSanctionInputSchema.parse({ nom: "", gravite: "leger" })).toThrow();
    expect(() => typeSanctionInputSchema.parse({ nom: "Blâme" })).toThrow();
  });
});
