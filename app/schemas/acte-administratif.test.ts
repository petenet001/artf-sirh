import { describe, it, expect } from "vitest";
import { acteAdministratifSchema, acteGenererSchema } from "./acte-administratif";

describe("acteAdministratifSchema", () => {
  const valid = {
    id: 1,
    dossier_integration_id: 5,
    type_acte: "decision_recrutement",
    numero: "ACT-2026-0001",
    signe: false,
  };

  it("valide un acte correct", () => {
    const parsed = acteAdministratifSchema.parse(valid);
    expect(parsed.id).toBe(1);
    expect(parsed.type_acte).toBe("decision_recrutement");
  });

  it("rejette un type_acte invalide", () => {
    expect(() => acteAdministratifSchema.parse({ ...valid, type_acte: "inconnu" })).toThrow();
  });

  it("rejette un id manquant", () => {
    const { id: _id, ...sansId } = valid;
    expect(() => acteAdministratifSchema.parse(sansId)).toThrow();
  });

  it("acteGenererSchema valide un input minimal", () => {
    const parsed = acteGenererSchema.parse({ type_acte: "contrat" });
    expect(parsed.type_acte).toBe("contrat");
  });

  it("acteGenererSchema rejette un type_acte manquant", () => {
    expect(() => acteGenererSchema.parse({ contenu: "x" })).toThrow();
  });
});
