import { describe, it, expect } from "vitest";
import {
  informationsProfessionnelleSchema,
  informationsProfessionnelleInputSchema,
} from "./informations-professionnelle";

describe("informationsProfessionnelleSchema", () => {
  it("valide un profil correct", () => {
    const parsed = informationsProfessionnelleSchema.parse({
      id: 1,
      agent_id: 12,
      diplome_id: 3,
      niveau_etude: "Master",
      specialite: "Informatique",
      annees_experience: 5,
      etablissement: "UMNG",
    });
    expect(parsed.annees_experience).toBe(5);
  });

  it("input : rejette annees_experience > 70", () => {
    expect(() => informationsProfessionnelleInputSchema.parse({ annees_experience: 71 })).toThrow();
  });

  it("input : accepte un diplome_id nul", () => {
    const parsed = informationsProfessionnelleInputSchema.parse({ diplome_id: null });
    expect(parsed.diplome_id).toBeNull();
  });
});
