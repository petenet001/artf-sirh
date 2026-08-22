import { describe, it, expect } from "vitest";
import { typeContratSchema, typeContratInputSchema } from "./type-contrat";

describe("typeContratSchema", () => {
  const valid = {
    id: 1,
    nom: "CDI",
    sigle: "CDI",
    description: null,
  };

  it("valide un type de contrat correct", () => {
    const parsed = typeContratSchema.parse(valid);
    expect(parsed.nom).toBe("CDI");
  });

  it("accepte un type de contrat minimal", () => {
    const parsed = typeContratSchema.parse({ id: 1, nom: "CDI" });
    expect(parsed.sigle).toBeUndefined();
  });

  it("rejette un nom manquant", () => {
    expect(() => typeContratSchema.parse({ id: 1 })).toThrow();
  });

  it("typeContratInputSchema exige nom et exclut l'id", () => {
    const shape = typeContratInputSchema.shape;
    expect("id" in shape).toBe(false);
    expect("nom" in shape).toBe(true);
  });

  it("typeContratInputSchema valide un payload minimal", () => {
    const parsed = typeContratInputSchema.parse({ nom: "CDI" });
    expect(parsed.nom).toBe("CDI");
  });
});
