import { describe, it, expect } from "vitest";
import { documentDossierSchema } from "./document-dossier";

describe("documentDossierSchema", () => {
  const valid = {
    id: 1,
    dossier_integration_id: 5,
    type_document_id: 2,
    nom_original: "cv.pdf",
    est_valide: false,
  };

  it("valide un document correct", () => {
    const parsed = documentDossierSchema.parse(valid);
    expect(parsed.id).toBe(1);
    expect(parsed.nom_original).toBe("cv.pdf");
  });

  it("rejette un id manquant", () => {
    const { id: _id, ...sansId } = valid;
    expect(() => documentDossierSchema.parse(sansId)).toThrow();
  });

  it("rejette un id de type invalide", () => {
    expect(() => documentDossierSchema.parse({ ...valid, id: "abc" })).toThrow();
  });
});
