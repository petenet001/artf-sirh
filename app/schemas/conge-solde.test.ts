import { describe, it, expect } from "vitest";
import { congeSoldeSchema } from "./conge-solde";

describe("congeSoldeSchema", () => {
  const valid = { id: 1, agent_id: 12, type_conge_id: 1, annee: 2026, solde_initial: 30, solde_actuel: 27 };

  it("valide un solde correct", () => {
    const parsed = congeSoldeSchema.parse(valid);
    expect(parsed.solde_actuel).toBe(27);
    expect(parsed.annee).toBe(2026);
  });

  it("expose le bonus d'ancienneté inclus dans le solde initial", () => {
    const parsed = congeSoldeSchema.parse({ ...valid, solde_initial: 36, jours_anciennete: 6 });
    expect(parsed.jours_anciennete).toBe(6);
  });

  it("rejette un solde_actuel non numérique", () => {
    expect(() => congeSoldeSchema.parse({ ...valid, solde_actuel: "27" })).toThrow();
  });

  it("rejette un agent_id manquant", () => {
    expect(() => congeSoldeSchema.parse({ id: 1, type_conge_id: 1, annee: 2026, solde_initial: 30, solde_actuel: 27 })).toThrow();
  });
});
