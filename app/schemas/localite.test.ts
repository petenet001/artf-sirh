import { describe, it, expect } from "vitest";
import { localiteSchema, localiteInputSchema } from "./localite";

describe("localiteSchema", () => {
  const valid = {
    id: 1,
    nom: "Conakry",
    sigle: "CKY",
    description: null,
    administrations: [{ id: 2, nom: "ARTF" }],
    created_at: "2026-01-01",
    updated_at: "2026-01-02",
  };

  it("valide une localité correcte", () => {
    const parsed = localiteSchema.parse(valid);
    expect(parsed.nom).toBe("Conakry");
    expect(parsed.administrations?.[0]?.id).toBe(2);
  });

  it("accepte une localité minimale (relations absentes)", () => {
    const parsed = localiteSchema.parse({ id: 1, nom: "Kindia" });
    expect(parsed.administrations).toBeUndefined();
  });

  it("rejette un nom manquant", () => {
    expect(() => localiteSchema.parse({ id: 1 })).toThrow();
  });

  it("localiteInputSchema exige nom et exclut les champs serveur", () => {
    const shape = localiteInputSchema.shape;
    expect("id" in shape).toBe(false);
    expect("administrations" in shape).toBe(false);
    expect("nom" in shape).toBe(true);
  });

  it("localiteInputSchema valide un payload minimal", () => {
    const parsed = localiteInputSchema.parse({ nom: "Boké" });
    expect(parsed.nom).toBe("Boké");
  });
});
