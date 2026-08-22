import { describe, it, expect } from "vitest";
import { affectationSchema, affectationInputSchema } from "./affectation";

describe("affectationSchema", () => {
  const valid = {
    id: 1,
    agent_id: 7,
    structurable_type: "App\\Models\\Direction",
    structurable_id: 2,
    date_affectation: "2026-01-10",
    statut: "active",
  };

  it("valide une affectation correcte", () => {
    const parsed = affectationSchema.parse(valid);
    expect(parsed.id).toBe(1);
    expect(parsed.structurable_id).toBe(2);
  });

  it("rejette un id manquant", () => {
    const { id: _id, ...sansId } = valid;
    expect(() => affectationSchema.parse(sansId)).toThrow();
  });

  it("affectationInputSchema valide un payload de création minimal", () => {
    const parsed = affectationInputSchema.parse({
      agent_id: 7,
      structurable_type: "App\\Models\\Service",
      structurable_id: 3,
      date_affectation: "2026-01-10",
    });
    expect(parsed.agent_id).toBe(7);
  });

  it("affectationInputSchema rejette un structurable_type invalide", () => {
    expect(() =>
      affectationInputSchema.parse({
        agent_id: 7,
        structurable_type: "App\\Models\\Inconnu",
        structurable_id: 3,
        date_affectation: "2026-01-10",
      }),
    ).toThrow();
  });
});
