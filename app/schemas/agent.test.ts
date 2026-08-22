import { describe, it, expect } from "vitest";
import { agentSchema, agentInputSchema, agentUpdateSchema } from "./agent";

/**
 * Test de référence : chaque schéma doit être couvert.
 * Sert de patron pour les futurs schémas (valide + rejette + types dérivés).
 * Les champs reflètent AgentResource / Agent\CreateRequest (API réelle).
 */
describe("agentSchema", () => {
  const valid = {
    id: 1,
    matricule: "AG-0001",
    nom: "Diallo",
    prenom: "Awa",
    date_naissance: "1990-05-12",
    genre: "F",
  };

  it("valide un agent correct et applique le statut par défaut", () => {
    const parsed = agentSchema.parse(valid);
    expect(parsed.matricule).toBe("AG-0001");
    expect(parsed.statut).toBe("actif");
    expect(parsed.date_naissance).toBe("1990-05-12");
  });

  it("accepte un matricule absent (assigné par le workflow d'intégration)", () => {
    const parsed = agentSchema.parse({ ...valid, matricule: undefined });
    expect(parsed.matricule).toBeUndefined();
  });

  it("rejette un genre invalide", () => {
    expect(() => agentSchema.parse({ ...valid, genre: "X" })).toThrow();
  });

  it("rejette un nom vide", () => {
    expect(() => agentSchema.parse({ ...valid, nom: "" })).toThrow();
  });

  it("agentInputSchema exige type_integration_id et exclut les champs serveur", () => {
    const shape = agentInputSchema.shape;
    expect("id" in shape).toBe(false);
    expect("statut" in shape).toBe(false);
    expect("matricule" in shape).toBe(false);
    expect("type_integration_id" in shape).toBe(true);
  });

  it("agentInputSchema valide un payload de création minimal", () => {
    const parsed = agentInputSchema.parse({
      nom: "Diallo",
      prenom: "Awa",
      date_naissance: "1990-05-12",
      genre: "F",
      type_integration_id: 3,
    });
    expect(parsed.type_integration_id).toBe(3);
  });

  it("agentUpdateSchema accepte un statut et ignore type_integration_id/diplome_id", () => {
    const shape = agentUpdateSchema.shape;
    expect("statut" in shape).toBe(true);
    expect("type_integration_id" in shape).toBe(false);
    expect("diplome_id" in shape).toBe(false);

    const parsed = agentUpdateSchema.parse({
      nom: "Diallo",
      prenom: "Awa",
      date_naissance: "1990-05-12",
      genre: "F",
      statut: "suspendu",
    });
    expect(parsed.statut).toBe("suspendu");
  });

  it("agentUpdateSchema rejette un statut invalide", () => {
    expect(() =>
      agentUpdateSchema.parse({
        nom: "Diallo",
        prenom: "Awa",
        date_naissance: "1990-05-12",
        genre: "F",
        statut: "parti",
      }),
    ).toThrow();
  });
});
