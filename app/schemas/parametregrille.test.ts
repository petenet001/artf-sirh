import { describe, it, expect } from "vitest";
import {
  parametregrilleSchema,
  parametregrilleInputSchema,
} from "./parametregrille";

/** Calqué sur agent.test.ts. Reflète ParametregrileResource / Parametregrile\UpdateRequest. */
describe("parametregrilleSchema", () => {
  const valid = {
    id: 1,
    valeur_point_indice: 4500.5,
    indice_base: 100,
    echelon_depart: 1,
    echelon_fin: 10,
    ecart_depart: 5,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };

  it("valide des paramètres corrects", () => {
    const parsed = parametregrilleSchema.parse(valid);
    expect(parsed.valeur_point_indice).toBe(4500.5);
    expect(parsed.echelon_fin).toBe(10);
  });

  it("rejette un indice_base manquant", () => {
    const { indice_base: _omit, ...rest } = valid;
    expect(() => parametregrilleSchema.parse(rest)).toThrow();
  });

  it("inputSchema accepte un payload vide (tous les champs optionnels)", () => {
    const parsed = parametregrilleInputSchema.parse({});
    expect(parsed).toEqual({});
  });

  it("inputSchema valide une mise à jour partielle", () => {
    const parsed = parametregrilleInputSchema.parse({ indice_base: 120 });
    expect(parsed.indice_base).toBe(120);
  });

  it("inputSchema rejette un indice_base non entier", () => {
    expect(() =>
      parametregrilleInputSchema.parse({ indice_base: 1.5 }),
    ).toThrow();
  });
});
