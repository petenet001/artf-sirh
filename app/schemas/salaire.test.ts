import { describe, it, expect } from "vitest";
import { salaireSchema, salaireGenerateSchema } from "./salaire";

/** Calqué sur agent.test.ts. Reflète SalaireResource / Salaire\GenerateRequest. */
describe("salaireSchema", () => {
  const valid = {
    id: 1,
    echelon: 3,
    indice: 250,
    salaire: 1125000,
    classe: {
      id: 2,
      coefficient: 120,
      categorie: { id: 4, nom: "Catégorie A", sigle: "A" },
      grade: { id: 5, nom: "Ingénieur", niveau: 5 },
    },
  };

  it("valide une ligne de salaire correcte", () => {
    const parsed = salaireSchema.parse(valid);
    expect(parsed.salaire).toBe(1125000);
    expect(parsed.classe?.categorie.sigle).toBe("A");
  });

  it("accepte une ligne sans classe chargée", () => {
    const parsed = salaireSchema.parse({
      id: 1,
      echelon: 3,
      indice: 250,
      salaire: 1125000,
    });
    expect(parsed.classe).toBeUndefined();
  });

  it("rejette un indice non numérique", () => {
    expect(() => salaireSchema.parse({ ...valid, indice: "x" })).toThrow();
  });

  it("generateSchema accepte un payload vide", () => {
    expect(salaireGenerateSchema.parse({})).toEqual({});
  });

  it("generateSchema expose valeur_point_indice", () => {
    const shape = salaireGenerateSchema.shape;
    expect("valeur_point_indice" in shape).toBe(true);
    const parsed = salaireGenerateSchema.parse({ valeur_point_indice: 4500 });
    expect(parsed.valeur_point_indice).toBe(4500);
  });
});
