import { describe, it, expect } from "vitest";
import {
  classegrillesalarialeSchema,
  classegrillesalarialeInputSchema,
} from "./classegrillesalariale";

/** Calqué sur agent.test.ts. Reflète ClassegrillesalarialeResource / Classegrillesalariale\CreateRequest. */
describe("classegrillesalarialeSchema", () => {
  const valid = {
    id: 1,
    coefficient: 120,
    categorie: { id: 2, nom: "Catégorie A", sigle: "A" },
    grade: { id: 3, nom: "Ingénieur", niveau: 5 },
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };

  it("valide une classe correcte", () => {
    const parsed = classegrillesalarialeSchema.parse(valid);
    expect(parsed.coefficient).toBe(120);
    expect(parsed.categorie?.sigle).toBe("A");
    expect(parsed.grade?.niveau).toBe(5);
  });

  it("accepte une classe sans relations chargées", () => {
    const parsed = classegrillesalarialeSchema.parse({ id: 1, coefficient: 120 });
    expect(parsed.categorie).toBeUndefined();
    expect(parsed.grade).toBeUndefined();
  });

  it("rejette un coefficient non numérique", () => {
    expect(() =>
      classegrillesalarialeSchema.parse({ ...valid, coefficient: "x" }),
    ).toThrow();
  });

  it("inputSchema expose categorie_id, grade_id, coefficient et exclut id", () => {
    const shape = classegrillesalarialeInputSchema.shape;
    expect("categorie_id" in shape).toBe(true);
    expect("grade_id" in shape).toBe(true);
    expect("coefficient" in shape).toBe(true);
    expect("id" in shape).toBe(false);
  });

  it("inputSchema valide un payload de création", () => {
    const parsed = classegrillesalarialeInputSchema.parse({
      categorie_id: 2,
      grade_id: 3,
      coefficient: 120,
    });
    expect(parsed.coefficient).toBe(120);
  });

  it("inputSchema rejette un coefficient hors bornes", () => {
    expect(() =>
      classegrillesalarialeInputSchema.parse({
        categorie_id: 2,
        grade_id: 3,
        coefficient: 0,
      }),
    ).toThrow();
    expect(() =>
      classegrillesalarialeInputSchema.parse({
        categorie_id: 2,
        grade_id: 3,
        coefficient: 501,
      }),
    ).toThrow();
  });
});
