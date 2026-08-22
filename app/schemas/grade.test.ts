import { describe, it, expect } from "vitest";
import { gradeSchema, gradeInputSchema } from "./grade";

describe("gradeSchema", () => {
  const valid = {
    id: 1,
    nom: "Ingénieur",
    sigle: "ING",
    description: null,
    niveau: 5,
  };

  it("valide un grade correct", () => {
    const parsed = gradeSchema.parse(valid);
    expect(parsed.nom).toBe("Ingénieur");
    expect(parsed.niveau).toBe(5);
  });

  it("accepte un grade minimal", () => {
    const parsed = gradeSchema.parse({ id: 1, nom: "Ingénieur" });
    expect(parsed.niveau).toBeUndefined();
  });

  it("rejette un nom manquant", () => {
    expect(() => gradeSchema.parse({ id: 1 })).toThrow();
  });

  it("gradeInputSchema exige nom et exclut l'id", () => {
    const shape = gradeInputSchema.shape;
    expect("id" in shape).toBe(false);
    expect("nom" in shape).toBe(true);
    expect("niveau" in shape).toBe(true);
  });

  it("gradeInputSchema valide un payload minimal", () => {
    const parsed = gradeInputSchema.parse({ nom: "Ingénieur" });
    expect(parsed.nom).toBe("Ingénieur");
  });

  it("gradeInputSchema rejette un nom vide", () => {
    expect(() => gradeInputSchema.parse({ nom: "" })).toThrow();
  });
});
