import { describe, it, expect } from "vitest";
import { remiseMaterielSchema, remiseMaterielInputSchema } from "./remise-materiel";

describe("remiseMaterielSchema", () => {
  const valid = {
    id: 1,
    agent_id: 7,
    materiel: ["Ordinateur portable", "Badge"],
    date_remise: "2026-02-01",
  };

  it("valide une remise correcte", () => {
    const parsed = remiseMaterielSchema.parse(valid);
    expect(parsed.id).toBe(1);
    expect(parsed.materiel).toEqual(["Ordinateur portable", "Badge"]);
  });

  it("rejette un id manquant", () => {
    const { id: _id, ...sansId } = valid;
    expect(() => remiseMaterielSchema.parse(sansId)).toThrow();
  });

  it("remiseMaterielInputSchema valide un payload de création minimal", () => {
    const parsed = remiseMaterielInputSchema.parse({
      agent_id: 7,
      materiel: ["Badge"],
      date_remise: "2026-02-01",
    });
    expect(parsed.agent_id).toBe(7);
  });

  it("remiseMaterielInputSchema rejette une liste de matériel vide", () => {
    expect(() =>
      remiseMaterielInputSchema.parse({
        agent_id: 7,
        materiel: [],
        date_remise: "2026-02-01",
      }),
    ).toThrow();
  });
});
