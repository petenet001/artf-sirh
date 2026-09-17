import { describe, it, expect } from "vitest";
import { directionSchema, directionInputSchema } from "./direction";

describe("directionSchema", () => {
  const valid = {
    id: 1,
    nom: "Direction RH",
    sigle: "DRHL",
    description: null,
    administration_id: 3,
    administration: { id: 3, nom: "Agence" },
    services: [{ id: 7, nom: "Paie" }],
  };

  it("valide une direction correcte", () => {
    const parsed = directionSchema.parse(valid);
    expect(parsed.administration?.id).toBe(3);
    expect(parsed.services?.[0]?.nom).toBe("Paie");
  });

  it("accepte une direction minimale", () => {
    const parsed = directionSchema.parse({ id: 1, nom: "Direction RH" });
    expect(parsed.services).toBeUndefined();
  });

  it("rejette un nom manquant", () => {
    expect(() => directionSchema.parse({ id: 1 })).toThrow();
  });

  it("directionInputSchema exige nom et administration_id", () => {
    const shape = directionInputSchema.shape;
    expect("id" in shape).toBe(false);
    expect("nom" in shape).toBe(true);
    expect("administration_id" in shape).toBe(true);
  });

  it("directionInputSchema valide un payload minimal", () => {
    const parsed = directionInputSchema.parse({ nom: "Direction RH", administration_id: 3 });
    expect(parsed.administration_id).toBe(3);
  });

  it("directionInputSchema rejette un payload sans administration_id", () => {
    expect(() => directionInputSchema.parse({ nom: "Direction RH" })).toThrow();
  });
});
