import { describe, it, expect } from "vitest";
import { informationsPersonnelleSchema, informationsPersonnelleInputSchema } from "./informations-personnelle";

describe("informationsPersonnelleSchema", () => {
  it("valide des coordonnées correctes", () => {
    const parsed = informationsPersonnelleSchema.parse({
      id: 1,
      agent_id: 12,
      adresse: "12 rue X",
      quartier: null,
      ville: "Brazzaville",
      code_postal: null,
      pays: "Congo",
    });
    expect(parsed.ville).toBe("Brazzaville");
  });

  it("accepte une fiche minimale", () => {
    const parsed = informationsPersonnelleSchema.parse({ id: 1, agent_id: 12 });
    expect(parsed.adresse).toBeUndefined();
  });

  it("input : rejette un code_postal trop long", () => {
    expect(() => informationsPersonnelleInputSchema.parse({ code_postal: "x".repeat(21) })).toThrow();
  });

  it("input : accepte un objet vide (upsert partiel)", () => {
    expect(informationsPersonnelleInputSchema.parse({})).toEqual({});
  });
});
