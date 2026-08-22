import { describe, it, expect } from "vitest";
import { administrationSchema, administrationInputSchema } from "./administration";

describe("administrationSchema", () => {
  const valid = {
    id: 1,
    nom: "Agence",
    sigle: "AG",
    description: null,
    localite_id: 5,
    localite: { id: 5, nom: "Conakry" },
    directions: [{ id: 9, nom: "DRH" }],
  };

  it("valide une administration correcte", () => {
    const parsed = administrationSchema.parse(valid);
    expect(parsed.localite?.id).toBe(5);
    expect(parsed.directions?.[0]?.nom).toBe("DRH");
  });

  it("accepte une administration minimale", () => {
    const parsed = administrationSchema.parse({ id: 1, nom: "Agence" });
    expect(parsed.localite).toBeUndefined();
  });

  it("rejette un id non numérique", () => {
    expect(() => administrationSchema.parse({ ...valid, id: "x" })).toThrow();
  });

  it("administrationInputSchema exige nom et localite_id", () => {
    const shape = administrationInputSchema.shape;
    expect("id" in shape).toBe(false);
    expect("nom" in shape).toBe(true);
    expect("localite_id" in shape).toBe(true);
  });

  it("administrationInputSchema valide un payload minimal", () => {
    const parsed = administrationInputSchema.parse({ nom: "Agence", localite_id: 5 });
    expect(parsed.localite_id).toBe(5);
  });

  it("administrationInputSchema rejette un payload sans localite_id", () => {
    expect(() => administrationInputSchema.parse({ nom: "Agence" })).toThrow();
  });
});
