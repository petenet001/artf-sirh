import { describe, it, expect } from "vitest";
import { typeAbsenceSchema, typeAbsenceInputSchema } from "./type-absence";

describe("typeAbsenceSchema", () => {
  const valid = {
    id: 1,
    nom: "Maladie",
    description: null,
    justification_requise: true,
  };

  it("valide un type d'absence correct", () => {
    const parsed = typeAbsenceSchema.parse(valid);
    expect(parsed.nom).toBe("Maladie");
    expect(parsed.justification_requise).toBe(true);
  });

  it("accepte un type d'absence minimal", () => {
    const parsed = typeAbsenceSchema.parse({ id: 1, nom: "Maladie" });
    expect(parsed.justification_requise).toBeUndefined();
  });

  it("rejette un justification_requise non booléen", () => {
    expect(() =>
      typeAbsenceSchema.parse({ ...valid, justification_requise: "oui" }),
    ).toThrow();
  });

  it("typeAbsenceInputSchema exige nom et exclut l'id", () => {
    const shape = typeAbsenceInputSchema.shape;
    expect("id" in shape).toBe(false);
    expect("nom" in shape).toBe(true);
    expect("justification_requise" in shape).toBe(true);
  });

  it("typeAbsenceInputSchema valide un payload minimal", () => {
    const parsed = typeAbsenceInputSchema.parse({ nom: "Maladie" });
    expect(parsed.nom).toBe("Maladie");
  });
});
