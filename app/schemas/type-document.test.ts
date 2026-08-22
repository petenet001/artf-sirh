import { describe, it, expect } from "vitest";
import { typeDocumentSchema, typeDocumentInputSchema } from "./type-document";

describe("typeDocumentSchema", () => {
  const valid = {
    id: 1,
    nom: "CNI",
    description: null,
    obligatoire: true,
  };

  it("valide un type de document correct", () => {
    const parsed = typeDocumentSchema.parse(valid);
    expect(parsed.nom).toBe("CNI");
    expect(parsed.obligatoire).toBe(true);
  });

  it("accepte un type de document minimal", () => {
    const parsed = typeDocumentSchema.parse({ id: 1, nom: "CNI" });
    expect(parsed.obligatoire).toBeUndefined();
  });

  it("rejette un obligatoire non booléen", () => {
    expect(() => typeDocumentSchema.parse({ ...valid, obligatoire: "oui" })).toThrow();
  });

  it("typeDocumentInputSchema exige nom et exclut l'id", () => {
    const shape = typeDocumentInputSchema.shape;
    expect("id" in shape).toBe(false);
    expect("nom" in shape).toBe(true);
    expect("obligatoire" in shape).toBe(true);
  });

  it("typeDocumentInputSchema valide un payload minimal", () => {
    const parsed = typeDocumentInputSchema.parse({ nom: "CNI" });
    expect(parsed.nom).toBe("CNI");
  });
});
