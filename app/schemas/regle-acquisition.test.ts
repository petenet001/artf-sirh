import { describe, it, expect } from "vitest";
import { regleAcquisitionSchema, regleAcquisitionInputSchema } from "./regle-acquisition";

describe("regleAcquisitionSchema", () => {
  const valid = { id: 1, type_conge_id: 1, jours_par_mois: 2.5, jours_max: 30 };

  it("valide une règle correcte", () => {
    const parsed = regleAcquisitionSchema.parse(valid);
    expect(parsed.jours_par_mois).toBe(2.5);
    expect(parsed.jours_max).toBe(30);
  });

  it("accepte un jours_max null", () => {
    const parsed = regleAcquisitionSchema.parse({ ...valid, jours_max: null });
    expect(parsed.jours_max).toBeNull();
  });

  it("regleAcquisitionInputSchema exige type_conge_id et jours_par_mois", () => {
    expect(() => regleAcquisitionInputSchema.parse({ jours_par_mois: 2.5 })).toThrow();
    const parsed = regleAcquisitionInputSchema.parse({ type_conge_id: 1, jours_par_mois: 2.5 });
    expect(parsed.type_conge_id).toBe(1);
  });

  it("regleAcquisitionInputSchema rejette un jours_par_mois négatif", () => {
    expect(() => regleAcquisitionInputSchema.parse({ type_conge_id: 1, jours_par_mois: -1 })).toThrow();
  });
});
