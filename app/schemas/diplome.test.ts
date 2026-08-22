import { describe, it, expect } from "vitest";
import { diplomeSchema, diplomeInputSchema } from "./diplome";

describe("diplomeSchema", () => {
  const valid = {
    id: 1,
    nom: "Master",
    sigle: "M2",
    description: null,
    classegrillesalariale_id: 3,
    classe_grille: {
      id: 3,
      coefficient: 1.5,
      categorie: "A",
      categorie_id: 2,
      grade: "Ingénieur",
      grade_id: 4,
    },
  };

  it("valide un diplôme correct avec sa classe de grille", () => {
    const parsed = diplomeSchema.parse(valid);
    expect(parsed.nom).toBe("Master");
    expect(parsed.classe_grille?.coefficient).toBe(1.5);
  });

  it("accepte un diplôme minimal", () => {
    const parsed = diplomeSchema.parse({ id: 1, nom: "Master" });
    expect(parsed.classe_grille).toBeUndefined();
  });

  it("rejette un nom manquant", () => {
    expect(() => diplomeSchema.parse({ id: 1 })).toThrow();
  });

  it("diplomeInputSchema exige nom et exclut l'id", () => {
    const shape = diplomeInputSchema.shape;
    expect("id" in shape).toBe(false);
    expect("nom" in shape).toBe(true);
    expect("classe_grille" in shape).toBe(false);
  });

  it("diplomeInputSchema valide un payload minimal", () => {
    const parsed = diplomeInputSchema.parse({ nom: "Master" });
    expect(parsed.nom).toBe("Master");
  });
});
