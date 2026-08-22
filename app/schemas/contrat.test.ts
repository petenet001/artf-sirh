import { describe, it, expect } from "vitest";
import { contratSchema, contratInputSchema } from "./contrat";

describe("contratSchema", () => {
  const valid = {
    id: 1,
    agent_id: 7,
    type_contrat_id: 2,
    date_debut: "2026-01-10",
    statut: "actif",
  };

  it("valide un contrat correct", () => {
    const parsed = contratSchema.parse(valid);
    expect(parsed.id).toBe(1);
    expect(parsed.type_contrat_id).toBe(2);
  });

  it("accepte une remuneration string ou number", () => {
    expect(contratSchema.parse({ ...valid, remuneration: "1500.00" }).remuneration).toBe("1500.00");
    expect(contratSchema.parse({ ...valid, remuneration: 1500 }).remuneration).toBe(1500);
  });

  it("rejette un id manquant", () => {
    const { id: _id, ...sansId } = valid;
    expect(() => contratSchema.parse(sansId)).toThrow();
  });

  it("contratInputSchema valide un payload de création minimal", () => {
    const parsed = contratInputSchema.parse({
      agent_id: 7,
      type_contrat_id: 2,
      date_debut: "2026-01-10",
    });
    expect(parsed.agent_id).toBe(7);
  });

  it("contratInputSchema rejette un agent_id manquant", () => {
    expect(() =>
      contratInputSchema.parse({ type_contrat_id: 2, date_debut: "2026-01-10" }),
    ).toThrow();
  });
});
