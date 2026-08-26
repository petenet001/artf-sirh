import { describe, it, expect } from "vitest";
import {
  affectationSchema,
  affectationInputSchema,
  affectationGroupeeInputSchema,
  lotAffectationSchema,
} from "./affectation";

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

  it("affectationGroupeeInputSchema valide un lot d'au moins deux agents", () => {
    const parsed = affectationGroupeeInputSchema.parse({
      date_affectation: "2026-01-10",
      motif: "Réorganisation",
      agents: [
        { agent_id: 1, structurable_type: "App\\Models\\Service", structurable_id: 3 },
        { agent_id: 2, structurable_type: "App\\Models\\Bureau", structurable_id: 4 },
      ],
    });
    expect(parsed.agents).toHaveLength(2);
  });

  it("affectationGroupeeInputSchema rejette un lot d'un seul agent", () => {
    expect(() =>
      affectationGroupeeInputSchema.parse({
        date_affectation: "2026-01-10",
        agents: [{ agent_id: 1, structurable_type: "App\\Models\\Service", structurable_id: 3 }],
      }),
    ).toThrow();
  });

  it("lotAffectationSchema valide un lot avec ses affectations", () => {
    const parsed = lotAffectationSchema.parse({
      id: 5,
      date_affectation: "2026-01-10",
      statut: "en_attente_validation",
      statut_label: "En attente de validation",
      total: 2,
      affectations: [{ ...valid, lot_affectation_id: 5 }],
    });
    expect(parsed.total).toBe(2);
    expect(parsed.affectations?.[0]?.lot_affectation_id).toBe(5);
  });
});
