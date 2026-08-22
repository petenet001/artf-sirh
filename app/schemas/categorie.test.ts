import { describe, it, expect } from "vitest";
import { categorieSchema, categorieInputSchema } from "./categorie";

describe("categorieSchema", () => {
  const valid = {
    id: 1,
    nom: "Catégorie A",
    sigle: "A",
    description: null,
  };

  it("valide une catégorie correcte", () => {
    const parsed = categorieSchema.parse(valid);
    expect(parsed.nom).toBe("Catégorie A");
  });

  it("accepte une catégorie minimale", () => {
    const parsed = categorieSchema.parse({ id: 1, nom: "Catégorie A" });
    expect(parsed.sigle).toBeUndefined();
  });

  it("rejette un nom manquant", () => {
    expect(() => categorieSchema.parse({ id: 1 })).toThrow();
  });

  it("categorieInputSchema exige nom et exclut l'id", () => {
    const shape = categorieInputSchema.shape;
    expect("id" in shape).toBe(false);
    expect("nom" in shape).toBe(true);
  });

  it("categorieInputSchema valide un payload minimal", () => {
    const parsed = categorieInputSchema.parse({ nom: "Catégorie A" });
    expect(parsed.nom).toBe("Catégorie A");
  });
});
