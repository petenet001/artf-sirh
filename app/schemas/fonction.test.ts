import { describe, it, expect } from "vitest";
import { fonctionSchema, fonctionInputSchema } from "./fonction";

describe("fonctionSchema", () => {
  const valid = {
    id: 1,
    nom: "Chef de service",
    sigle: "CS",
    description: null,
  };

  it("valide une fonction correcte", () => {
    const parsed = fonctionSchema.parse(valid);
    expect(parsed.nom).toBe("Chef de service");
  });

  it("accepte une fonction minimale", () => {
    const parsed = fonctionSchema.parse({ id: 1, nom: "Chef de service" });
    expect(parsed.sigle).toBeUndefined();
  });

  it("rejette un nom manquant", () => {
    expect(() => fonctionSchema.parse({ id: 1 })).toThrow();
  });

  it("fonctionInputSchema exige nom et exclut l'id", () => {
    const shape = fonctionInputSchema.shape;
    expect("id" in shape).toBe(false);
    expect("nom" in shape).toBe(true);
  });

  it("fonctionInputSchema valide un payload minimal", () => {
    const parsed = fonctionInputSchema.parse({ nom: "Chef de service" });
    expect(parsed.nom).toBe("Chef de service");
  });
});
