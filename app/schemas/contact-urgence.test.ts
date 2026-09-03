import { describe, it, expect } from "vitest";
import { contactUrgenceSchema, contactUrgenceInputSchema } from "./contact-urgence";

describe("contactUrgenceSchema", () => {
  it("valide un contact correct", () => {
    const parsed = contactUrgenceSchema.parse({
      id: 1,
      agent_id: 12,
      nom: "Doe",
      prenom: "Jane",
      telephone: "+242060000000",
      relation: "Épouse",
    });
    expect(parsed.nom).toBe("Doe");
  });

  it("input : exige nom, prénom et téléphone", () => {
    expect(() => contactUrgenceInputSchema.parse({ nom: "Doe" })).toThrow();
    const parsed = contactUrgenceInputSchema.parse({ nom: "Doe", prenom: "Jane", telephone: "0600" });
    expect(parsed.telephone).toBe("0600");
  });
});
