import { describe, it, expect } from "vitest";
import { visiteMedicaleSchema, visiteMedicaleInputSchema } from "./visite-medicale";

describe("visiteMedicaleSchema", () => {
  const base = {
    id: 1,
    agent_id: 12,
    type: "annuelle",
    type_label: "Visite annuelle",
    date_visite: "2026-03-14",
    structure_sanitaire_id: 2,
  };

  it("valide une visite", () => {
    expect(visiteMedicaleSchema.parse(base).type).toBe("annuelle");
  });

  it("n'attend ni statut ni décision : une visite est constatée, pas instruite", () => {
    const v = visiteMedicaleSchema.parse(base) as Record<string, unknown>;
    expect(v.statut).toBeUndefined();
    expect(v.prochaine_etape).toBeUndefined();
  });

  it("refuse un type de visite inconnu", () => {
    expect(() => visiteMedicaleSchema.parse({ ...base, type: "controle_inopine" })).toThrow();
  });
});

describe("visiteMedicaleInputSchema", () => {
  it("exige agent, type, date et structure", () => {
    expect(() => visiteMedicaleInputSchema.parse({ agent_id: 1, type: "annuelle" })).toThrow();
  });

  it("valide une saisie complète", () => {
    const v = visiteMedicaleInputSchema.parse({
      agent_id: 12,
      type: "embauche",
      date_visite: "2026-01-05",
      structure_sanitaire_id: 2,
      observations: "Apte",
    });
    expect(v.observations).toBe("Apte");
  });
});
