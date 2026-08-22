import { describe, it, expect } from "vitest";
import { typeCongeSchema, typeCongeInputSchema } from "./type-conge";

describe("typeCongeSchema", () => {
  const valid = {
    id: 1,
    nom: "Congé annuel",
    description: null,
    jours_max: 30,
  };

  it("valide un type de congé correct", () => {
    const parsed = typeCongeSchema.parse(valid);
    expect(parsed.nom).toBe("Congé annuel");
    expect(parsed.jours_max).toBe(30);
  });

  it("accepte un type de congé minimal", () => {
    const parsed = typeCongeSchema.parse({ id: 1, nom: "Congé annuel" });
    expect(parsed.jours_max).toBeUndefined();
  });

  it("rejette un jours_max non numérique", () => {
    expect(() => typeCongeSchema.parse({ ...valid, jours_max: "trente" })).toThrow();
  });

  it("typeCongeInputSchema exige nom et exclut l'id", () => {
    const shape = typeCongeInputSchema.shape;
    expect("id" in shape).toBe(false);
    expect("nom" in shape).toBe(true);
    expect("jours_max" in shape).toBe(true);
  });

  it("typeCongeInputSchema valide un payload minimal", () => {
    const parsed = typeCongeInputSchema.parse({ nom: "Congé annuel" });
    expect(parsed.nom).toBe("Congé annuel");
  });

  it("typeCongeInputSchema rejette un jours_max négatif", () => {
    expect(() => typeCongeInputSchema.parse({ nom: "X", jours_max: -1 })).toThrow();
  });
});
