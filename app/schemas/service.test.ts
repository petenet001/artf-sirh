import { describe, it, expect } from "vitest";
import { serviceSchema, serviceInputSchema } from "./service";

describe("serviceSchema", () => {
  const valid = {
    id: 1,
    nom: "Service Paie",
    sigle: "SP",
    description: null,
    direction_id: 4,
    direction: { id: 4, nom: "Direction RH" },
    bureaux: [{ id: 8, nom: "Bureau Salaires" }],
  };

  it("valide un service correct", () => {
    const parsed = serviceSchema.parse(valid);
    expect(parsed.direction?.id).toBe(4);
    expect(parsed.bureaux?.[0]?.nom).toBe("Bureau Salaires");
  });

  it("accepte un service minimal", () => {
    const parsed = serviceSchema.parse({ id: 1, nom: "Service Paie" });
    expect(parsed.bureaux).toBeUndefined();
  });

  it("rejette un nom manquant", () => {
    expect(() => serviceSchema.parse({ id: 1 })).toThrow();
  });

  it("serviceInputSchema exige nom et direction_id", () => {
    const shape = serviceInputSchema.shape;
    expect("id" in shape).toBe(false);
    expect("nom" in shape).toBe(true);
    expect("direction_id" in shape).toBe(true);
  });

  it("serviceInputSchema valide un payload minimal", () => {
    const parsed = serviceInputSchema.parse({ nom: "Service Paie", direction_id: 4 });
    expect(parsed.direction_id).toBe(4);
  });

  it("serviceInputSchema rejette un payload sans direction_id", () => {
    expect(() => serviceInputSchema.parse({ nom: "Service Paie" })).toThrow();
  });
});
