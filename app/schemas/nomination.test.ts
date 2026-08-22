import { describe, it, expect } from "vitest";
import { nominationSchema, nominationInputSchema } from "./nomination";

describe("nominationSchema", () => {
  const valid = {
    id: 1,
    agent_id: 7,
    poste: "Chef de Service",
    date_debut: "2026-01-10",
    statut: "active",
  };

  it("valide une nomination correcte", () => {
    const parsed = nominationSchema.parse(valid);
    expect(parsed.id).toBe(1);
    expect(parsed.poste).toBe("Chef de Service");
  });

  it("rejette un id manquant", () => {
    const { id: _id, ...sansId } = valid;
    expect(() => nominationSchema.parse(sansId)).toThrow();
  });

  it("nominationInputSchema valide un payload de création minimal", () => {
    const parsed = nominationInputSchema.parse({
      agent_id: 7,
      poste: "Chef de Bureau",
      structurable_type: "App\\Models\\Bureau",
      structurable_id: 4,
      date_debut: "2026-01-10",
    });
    expect(parsed.poste).toBe("Chef de Bureau");
  });

  it("nominationInputSchema rejette un poste invalide", () => {
    expect(() =>
      nominationInputSchema.parse({
        agent_id: 7,
        poste: "Stagiaire",
        structurable_type: "App\\Models\\Bureau",
        structurable_id: 4,
        date_debut: "2026-01-10",
      }),
    ).toThrow();
  });
});
