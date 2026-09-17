import { describe, it, expect } from "vitest";
import {
  circuitValidationSchema,
  circuitAjouterNiveauSchema,
  circuitRemplacerSchema,
} from "./circuit-validation";

/** Reflète CircuitValidationResource + CircuitValidationController. */
describe("circuitValidationSchema", () => {
  const valid = {
    id: 1,
    type_integration_id: 2,
    niveau: "DRHL",
    niveau_label: "DRHL",
    ordre: 1,
    actif: true,
  };

  it("valide une étape de circuit correcte", () => {
    const parsed = circuitValidationSchema.parse(valid);
    expect(parsed.niveau).toBe("DRHL");
    expect(parsed.actif).toBe(true);
  });

  it("rejette un niveau hors enum", () => {
    expect(() => circuitValidationSchema.parse({ ...valid, niveau: "ministre" })).toThrow();
  });

  it("ajouterNiveau exige un niveau valide", () => {
    expect(() => circuitAjouterNiveauSchema.parse({ ordre: 1 })).toThrow();
    expect(circuitAjouterNiveauSchema.parse({ niveau: "directeur" }).niveau).toBe("directeur");
  });

  it("remplacer attend un tableau de niveaux", () => {
    const parsed = circuitRemplacerSchema.parse({ niveaux: ["chef_service", "DRHL"] });
    expect(parsed.niveaux).toHaveLength(2);
    expect(() => circuitRemplacerSchema.parse({ niveaux: ["inconnu"] })).toThrow();
  });
});
