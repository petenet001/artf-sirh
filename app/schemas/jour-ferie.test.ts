import { describe, it, expect } from "vitest";
import { jourFerieSchema, jourFerieInputSchema } from "./jour-ferie";

describe("jourFerieSchema", () => {
  const valid = { id: 1, nom: "Fête nationale", date: "2026-08-15", recurrent: true };

  it("valide un jour férié correct", () => {
    const parsed = jourFerieSchema.parse(valid);
    expect(parsed.nom).toBe("Fête nationale");
    expect(parsed.recurrent).toBe(true);
  });

  it("rejette un recurrent absent", () => {
    expect(() => jourFerieSchema.parse({ id: 1, nom: "X", date: "2026-08-15" })).toThrow();
  });

  it("jourFerieInputSchema exige nom et date", () => {
    expect(() => jourFerieInputSchema.parse({ nom: "X" })).toThrow();
    const parsed = jourFerieInputSchema.parse({ nom: "X", date: "2026-01-01", recurrent: true });
    expect(parsed.date).toBe("2026-01-01");
  });
});
