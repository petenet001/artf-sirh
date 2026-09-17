import { describe, it, expect } from "vitest";
import {
  validationWorkflowSchema,
  validationDecisionSchema,
  validationRejectionSchema,
} from "./validation-workflow";

describe("validationWorkflowSchema", () => {
  const valid = {
    id: 1,
    niveau: "DRHL",
    ordre: 2,
    statut: "en_attente",
  };

  it("valide une étape correcte", () => {
    const parsed = validationWorkflowSchema.parse(valid);
    expect(parsed.id).toBe(1);
    expect(parsed.niveau).toBe("DRHL");
  });

  it("rejette un niveau invalide", () => {
    expect(() => validationWorkflowSchema.parse({ ...valid, niveau: "inconnu" })).toThrow();
  });

  it("rejette un statut manquant", () => {
    const { statut: _statut, ...sansStatut } = valid;
    expect(() => validationWorkflowSchema.parse(sansStatut)).toThrow();
  });

  it("validationDecisionSchema accepte un commentaire optionnel", () => {
    expect(validationDecisionSchema.parse({}).commentaire).toBeUndefined();
    expect(validationDecisionSchema.parse({ commentaire: "ok" }).commentaire).toBe("ok");
  });

  it("validationRejectionSchema exige un commentaire non vide", () => {
    expect(validationRejectionSchema.parse({ commentaire: "motif" }).commentaire).toBe("motif");
    expect(() => validationRejectionSchema.parse({ commentaire: "" })).toThrow();
  });
});
