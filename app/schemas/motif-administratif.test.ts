import { describe, it, expect } from "vitest";
import { motifAdministratifSchema, motifAdministratifInputSchema } from "./motif-administratif";

describe("motifAdministratifSchema", () => {
  const valid = {
    id: 1,
    nom: "Mutation",
    description: null,
  };

  it("valide un motif administratif correct", () => {
    const parsed = motifAdministratifSchema.parse(valid);
    expect(parsed.nom).toBe("Mutation");
  });

  it("accepte un motif minimal", () => {
    const parsed = motifAdministratifSchema.parse({ id: 1, nom: "Mutation" });
    expect(parsed.description).toBeUndefined();
  });

  it("rejette un nom manquant", () => {
    expect(() => motifAdministratifSchema.parse({ id: 1 })).toThrow();
  });

  it("motifAdministratifInputSchema exige nom et exclut l'id", () => {
    const shape = motifAdministratifInputSchema.shape;
    expect("id" in shape).toBe(false);
    expect("nom" in shape).toBe(true);
  });

  it("motifAdministratifInputSchema valide un payload minimal", () => {
    const parsed = motifAdministratifInputSchema.parse({ nom: "Mutation" });
    expect(parsed.nom).toBe("Mutation");
  });
});
