import { describe, it, expect } from "vitest";
import { situationFamilialeSchema, situationFamilialeInputSchema } from "./situation-familiale";

describe("situationFamilialeSchema", () => {
  it("valide une situation correcte", () => {
    const parsed = situationFamilialeSchema.parse({ id: 1, agent_id: 12, statut_matrimonial: "marie", nb_enfants: 2 });
    expect(parsed.statut_matrimonial).toBe("marie");
    expect(parsed.nb_enfants).toBe(2);
  });

  it("rejette un statut matrimonial hors enum", () => {
    expect(() => situationFamilialeSchema.parse({ id: 1, agent_id: 12, statut_matrimonial: "concubinage" })).toThrow();
  });

  it("input : rejette nb_enfants négatif", () => {
    expect(() => situationFamilialeInputSchema.parse({ nb_enfants: -1 })).toThrow();
  });

  it("input : accepte union_libre", () => {
    expect(situationFamilialeInputSchema.parse({ statut_matrimonial: "union_libre" }).statut_matrimonial).toBe("union_libre");
  });
});
