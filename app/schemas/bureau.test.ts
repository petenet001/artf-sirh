import { describe, it, expect } from "vitest";
import { bureauSchema, bureauInputSchema } from "./bureau";

describe("bureauSchema", () => {
  const valid = {
    id: 1,
    nom: "Bureau Salaires",
    sigle: "BS",
    description: null,
    service_id: 6,
    service: { id: 6, nom: "Service Paie" },
  };

  it("valide un bureau correct", () => {
    const parsed = bureauSchema.parse(valid);
    expect(parsed.service?.id).toBe(6);
    expect(parsed.nom).toBe("Bureau Salaires");
  });

  it("accepte un bureau minimal", () => {
    const parsed = bureauSchema.parse({ id: 1, nom: "Bureau Salaires" });
    expect(parsed.service).toBeUndefined();
  });

  it("rejette un nom manquant", () => {
    expect(() => bureauSchema.parse({ id: 1 })).toThrow();
  });

  it("bureauInputSchema exige nom et service_id", () => {
    const shape = bureauInputSchema.shape;
    expect("id" in shape).toBe(false);
    expect("nom" in shape).toBe(true);
    expect("service_id" in shape).toBe(true);
  });

  it("bureauInputSchema valide un payload minimal", () => {
    const parsed = bureauInputSchema.parse({ nom: "Bureau Salaires", service_id: 6 });
    expect(parsed.service_id).toBe(6);
  });

  it("bureauInputSchema rejette un payload sans service_id", () => {
    expect(() => bureauInputSchema.parse({ nom: "Bureau Salaires" })).toThrow();
  });
});
