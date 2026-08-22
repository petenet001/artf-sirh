import { describe, it, expect } from "vitest";
import { echelonSchema, echelonInputSchema } from "./echelon";

describe("echelonSchema", () => {
  const valid = {
    id: 1,
    nom: "Échelon 1",
    numero: 1,
    description: null,
  };

  it("valide un échelon correct", () => {
    const parsed = echelonSchema.parse(valid);
    expect(parsed.numero).toBe(1);
  });

  it("rejette un numero manquant", () => {
    expect(() => echelonSchema.parse({ id: 1, nom: "Échelon 1" })).toThrow();
  });

  it("rejette un nom manquant", () => {
    expect(() => echelonSchema.parse({ id: 1, numero: 1 })).toThrow();
  });

  it("echelonInputSchema exige nom et numero, exclut l'id", () => {
    const shape = echelonInputSchema.shape;
    expect("id" in shape).toBe(false);
    expect("nom" in shape).toBe(true);
    expect("numero" in shape).toBe(true);
  });

  it("echelonInputSchema valide un payload minimal", () => {
    const parsed = echelonInputSchema.parse({ nom: "Échelon 1", numero: 1 });
    expect(parsed.numero).toBe(1);
  });

  it("echelonInputSchema rejette un numero < 1", () => {
    expect(() => echelonInputSchema.parse({ nom: "Échelon 0", numero: 0 })).toThrow();
  });
});
