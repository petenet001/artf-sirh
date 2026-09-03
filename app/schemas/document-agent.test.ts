import { describe, it, expect } from "vitest";
import { documentAgentSchema, documentAgentInputSchema } from "./document-agent";

describe("documentAgentSchema", () => {
  it("valide un document correct", () => {
    const parsed = documentAgentSchema.parse({
      id: 1,
      agent_id: 12,
      type_document_id: 3,
      titre: "CNI",
      sous_dossier: "general",
      nom_original: "cni.pdf",
      taille: 20480,
      mime_type: "application/pdf",
    });
    expect(parsed.nom_original).toBe("cni.pdf");
  });

  it("accepte un document minimal", () => {
    const parsed = documentAgentSchema.parse({ id: 1, agent_id: 12 });
    expect(parsed.titre).toBeUndefined();
  });

  it("input : exige type_document_id", () => {
    expect(() => documentAgentInputSchema.parse({ titre: "X" })).toThrow();
    expect(documentAgentInputSchema.parse({ type_document_id: 3 }).type_document_id).toBe(3);
  });
});
