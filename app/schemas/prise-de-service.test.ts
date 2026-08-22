import { describe, it, expect } from "vitest";
import { priseDeServiceSchema, priseDeServiceInputSchema } from "./prise-de-service";

describe("priseDeServiceSchema", () => {
  const valid = {
    id: 1,
    agent_id: 7,
    responsable_id: 3,
    date_prise_service: "2026-03-01",
  };

  it("valide une prise de service correcte", () => {
    const parsed = priseDeServiceSchema.parse(valid);
    expect(parsed.id).toBe(1);
    expect(parsed.responsable_id).toBe(3);
  });

  it("rejette un id manquant", () => {
    const { id: _id, ...sansId } = valid;
    expect(() => priseDeServiceSchema.parse(sansId)).toThrow();
  });

  it("priseDeServiceInputSchema valide un payload de création minimal", () => {
    const parsed = priseDeServiceInputSchema.parse({
      agent_id: 7,
      responsable_id: 3,
      date_prise_service: "2026-03-01",
    });
    expect(parsed.agent_id).toBe(7);
  });

  it("priseDeServiceInputSchema rejette un responsable_id manquant", () => {
    expect(() =>
      priseDeServiceInputSchema.parse({ agent_id: 7, date_prise_service: "2026-03-01" }),
    ).toThrow();
  });
});
