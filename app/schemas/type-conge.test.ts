import { describe, it, expect } from "vitest";
import { typeCongeSchema, typeCongeInputSchema } from "./type-conge";

describe("typeCongeSchema", () => {
  const valid = {
    id: 1,
    nom: "Congé annuel",
    description: null,
    jours_max: 30,
  };

  it("valide un type de congé correct", () => {
    const parsed = typeCongeSchema.parse(valid);
    expect(parsed.nom).toBe("Congé annuel");
    expect(parsed.jours_max).toBe(30);
  });

  it("accepte un type de congé minimal", () => {
    const parsed = typeCongeSchema.parse({ id: 1, nom: "Congé annuel" });
    expect(parsed.jours_max).toBeUndefined();
  });

  it("rejette un jours_max non numérique", () => {
    expect(() => typeCongeSchema.parse({ ...valid, jours_max: "trente" })).toThrow();
  });

  it("typeCongeInputSchema exige nom et exclut l'id", () => {
    const shape = typeCongeInputSchema.shape;
    expect("id" in shape).toBe(false);
    expect("nom" in shape).toBe(true);
    expect("jours_max" in shape).toBe(true);
  });

  it("typeCongeInputSchema valide un payload minimal", () => {
    const parsed = typeCongeInputSchema.parse({ nom: "Congé annuel" });
    expect(parsed.nom).toBe("Congé annuel");
  });

  it("typeCongeInputSchema rejette un jours_max négatif", () => {
    expect(() => typeCongeInputSchema.parse({ nom: "X", jours_max: -1 })).toThrow();
  });

  it("expose les flags de circuit (necessite_*, debite_solde, justificatif_requis)", () => {
    const parsed = typeCongeSchema.parse({
      ...valid,
      necessite_n1: true,
      necessite_rh: true,
      necessite_dg: false,
      debite_solde: true,
      justificatif_requis: false,
    });
    expect(parsed.necessite_n1).toBe(true);
    expect(parsed.debite_solde).toBe(true);
    expect(parsed.justificatif_requis).toBe(false);
  });

  it("typeCongeInputSchema accepte les flags booléens", () => {
    const parsed = typeCongeInputSchema.parse({ nom: "Sans solde", necessite_dg: true, debite_solde: false });
    expect(parsed.necessite_dg).toBe(true);
    expect(parsed.debite_solde).toBe(false);
  });
});
