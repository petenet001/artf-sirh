import { describe, it, expect } from "vitest";
import {
  connaissanceComplementaireSchema,
  connaissanceComplementaireInputSchema,
} from "./connaissance-complementaire";

describe("connaissanceComplementaireSchema", () => {
  const valid = {
    id: 1,
    evaluation_id: 12,
    type: "formation",
    domaine: "Gestion de projet",
    description: "Formation PMP souhaitée.",
    urgent: true,
  };

  it("valide un besoin de formation", () => {
    expect(connaissanceComplementaireSchema.parse(valid).urgent).toBe(true);
  });

  it("rejette un type hors enum", () => {
    expect(() => connaissanceComplementaireSchema.parse({ ...valid, type: "seminaire" })).toThrow();
  });
});

describe("connaissanceComplementaireInputSchema", () => {
  it("exige le domaine", () => {
    expect(() => connaissanceComplementaireInputSchema.parse({ type: "autre", domaine: "" })).toThrow();
    expect(connaissanceComplementaireInputSchema.parse({ type: "autre", domaine: "Rédaction" }).domaine).toBe("Rédaction");
  });
});
