import { describe, it, expect } from "vitest";
import {
  salaireAgentSchema,
  salaireAgentCreateSchema,
  salaireAgentCloturerSchema,
  salaireAgentAvancerEchelonSchema,
} from "./salaire-agent";

/** Reflète SalaireAgentResource + SalaireAgent/*Request. */
describe("salaireAgentSchema", () => {
  const valid = {
    id: 1,
    agent_id: 7,
    salaire_id: 3,
    classegrillesalariale_id: 5,
    echelon: 2,
    montant_base: 450000,
    montant_net: 420000,
    date_debut: "2026-01-01",
    date_fin: null,
    statut: "actif",
    type_changement: "initial",
    type_changement_label: "Salaire initial",
    motif: null,
  };

  it("valide un salaire d'agent correct", () => {
    const parsed = salaireAgentSchema.parse(valid);
    expect(parsed.montant_base).toBe(450000);
    expect(parsed.statut).toBe("actif");
  });

  it("accepte les champs de variation de l'historique", () => {
    const parsed = salaireAgentSchema.parse({
      ...valid,
      type_changement: "avancement_echelon",
      echelon_precedent: 1,
      montant_precedent: 400000,
      variation_echelon: 1,
      variation_montant: 50000,
    });
    expect(parsed.variation_montant).toBe(50000);
  });

  it("rejette un statut hors enum", () => {
    expect(() => salaireAgentSchema.parse({ ...valid, statut: "annule" })).toThrow();
  });

  it("rejette un montant_base non numérique", () => {
    expect(() => salaireAgentSchema.parse({ ...valid, montant_base: "x" })).toThrow();
  });

  it("createSchema exige agent_id", () => {
    expect(() => salaireAgentCreateSchema.parse({})).toThrow();
    expect(salaireAgentCreateSchema.parse({ agent_id: 7 }).agent_id).toBe(7);
  });

  it("cloturer et avancer-échelon acceptent un payload vide", () => {
    expect(salaireAgentCloturerSchema.parse({})).toEqual({});
    expect(salaireAgentAvancerEchelonSchema.parse({})).toEqual({});
  });
});
