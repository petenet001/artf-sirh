import { describe, it, expect } from "vitest";
import {
  dossierIntegrationSchema,
  dossierIntegrationInputSchema,
  dossierTransitionSchema,
  assignerMatriculeSchema,
} from "./dossier-integration";

describe("dossierIntegrationSchema", () => {
  const valid = {
    id: 1,
    reference: "DI-2026-0001",
    statut: "BROUILLON",
    date_demande: "2026-01-05",
  };

  it("valide un dossier correct", () => {
    const parsed = dossierIntegrationSchema.parse(valid);
    expect(parsed.id).toBe(1);
    expect(parsed.statut).toBe("BROUILLON");
  });

  it("rejette un statut invalide", () => {
    expect(() => dossierIntegrationSchema.parse({ ...valid, statut: "INCONNU" })).toThrow();
  });

  it("rejette un id manquant", () => {
    const { id: _id, ...sansId } = valid;
    expect(() => dossierIntegrationSchema.parse(sansId)).toThrow();
  });

  it("dossierIntegrationInputSchema valide un payload de création minimal", () => {
    const parsed = dossierIntegrationInputSchema.parse({ type_integration_id: 3 });
    expect(parsed.type_integration_id).toBe(3);
  });

  it("dossierIntegrationInputSchema rejette un type_integration_id manquant", () => {
    expect(() => dossierIntegrationInputSchema.parse({})).toThrow();
  });

  it("dossierTransitionSchema accepte un commentaire optionnel", () => {
    expect(dossierTransitionSchema.parse({}).commentaire).toBeUndefined();
    expect(dossierTransitionSchema.parse({ commentaire: "ok" }).commentaire).toBe("ok");
  });

  it("assignerMatriculeSchema exige un matricule non vide", () => {
    expect(assignerMatriculeSchema.parse({ matricule: "AG-0001" }).matricule).toBe("AG-0001");
    expect(() => assignerMatriculeSchema.parse({ matricule: "" })).toThrow();
  });
});
