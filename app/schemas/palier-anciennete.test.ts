import { describe, it, expect } from "vitest";
import { palierAncienneteSchema, palierAncienneteInputSchema } from "./palier-anciennete";

describe("palierAncienneteSchema", () => {
  it("valide un palier borné et le dernier palier sans plafond", () => {
    expect(palierAncienneteSchema.parse({ id: 2, anciennete_min: 5, anciennete_max: 9, jours_bonus: 6 }).jours_bonus).toBe(6);
    expect(palierAncienneteSchema.parse({ id: 8, anciennete_min: 35, anciennete_max: null, jours_bonus: 18 }).anciennete_max).toBeNull();
  });

  it("rejette un jours_bonus manquant", () => {
    expect(() => palierAncienneteSchema.parse({ id: 1, anciennete_min: 0 })).toThrow();
  });
});

describe("palierAncienneteInputSchema", () => {
  it("accepte un maximum absent (pas de plafond)", () => {
    expect(palierAncienneteInputSchema.parse({ anciennete_min: 35, jours_bonus: 18 }).anciennete_max).toBeUndefined();
  });

  it("rejette un maximum inférieur au minimum", () => {
    const res = palierAncienneteInputSchema.safeParse({ anciennete_min: 10, anciennete_max: 5, jours_bonus: 8 });
    expect(res.success).toBe(false);
    expect(res.error?.issues[0]?.path).toEqual(["anciennete_max"]);
  });

  it("rejette des valeurs négatives ou décimales", () => {
    expect(() => palierAncienneteInputSchema.parse({ anciennete_min: -1, jours_bonus: 0 })).toThrow();
    expect(() => palierAncienneteInputSchema.parse({ anciennete_min: 0, jours_bonus: 2.5 })).toThrow();
  });
});
