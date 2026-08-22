import { describe, it, expect } from "vitest";
import { typeIntegrationSchema, typeIntegrationInputSchema } from "./type-integration";

describe("typeIntegrationSchema", () => {
  const valid = {
    id: 1,
    nom: "Recrutement direct",
    description: null,
  };

  it("valide un type d'intégration correct", () => {
    const parsed = typeIntegrationSchema.parse(valid);
    expect(parsed.nom).toBe("Recrutement direct");
  });

  it("accepte un type d'intégration minimal", () => {
    const parsed = typeIntegrationSchema.parse({ id: 1, nom: "Recrutement direct" });
    expect(parsed.description).toBeUndefined();
  });

  it("rejette un nom manquant", () => {
    expect(() => typeIntegrationSchema.parse({ id: 1 })).toThrow();
  });

  it("typeIntegrationInputSchema exige nom et exclut l'id", () => {
    const shape = typeIntegrationInputSchema.shape;
    expect("id" in shape).toBe(false);
    expect("nom" in shape).toBe(true);
  });

  it("typeIntegrationInputSchema valide un payload minimal", () => {
    const parsed = typeIntegrationInputSchema.parse({ nom: "Recrutement direct" });
    expect(parsed.nom).toBe("Recrutement direct");
  });

  it("expose les champs de configuration et documents_obligatoires", () => {
    const parsed = typeIntegrationSchema.parse({
      id: 1,
      nom: "Stage professionnel",
      necessite_contrat: true,
      necessite_validation_dg: false,
      necessite_compte_utilisateur: false,
      prefixe_matricule: "STG",
      duree_max_mois: 6,
      documents_obligatoires: [{ id: 3, nom: "CV" }],
    });
    expect(parsed.prefixe_matricule).toBe("STG");
    expect(parsed.necessite_contrat).toBe(true);
    expect(parsed.documents_obligatoires?.[0]?.nom).toBe("CV");
  });

  it("typeIntegrationInputSchema accepte documents_ids", () => {
    const parsed = typeIntegrationInputSchema.parse({ nom: "Stage", documents_ids: [1, 2, 3] });
    expect(parsed.documents_ids).toEqual([1, 2, 3]);
  });
});
