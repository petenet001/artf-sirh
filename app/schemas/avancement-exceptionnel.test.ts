import { describe, it, expect } from "vitest";
import {
  avancementExceptionnelSchema,
  avancementExceptionnelInputSchema,
} from "./avancement-exceptionnel";

describe("avancementExceptionnelSchema", () => {
  const valid = {
    id: 1,
    agent_id: 12,
    commission_avancement_id: 5,
    nb_echelons: 2,
    motif: "Performances exceptionnelles.",
    date_proposition: "2026-09-16",
    statut: "en_attente",
  };

  it("valide une proposition", () => {
    expect(avancementExceptionnelSchema.parse(valid).nb_echelons).toBe(2);
  });

  it("partage le cycle de statut de la bonification", () => {
    expect(avancementExceptionnelSchema.parse({ ...valid, statut: "approuvee" }).statut).toBe("approuvee");
    expect(() => avancementExceptionnelSchema.parse({ ...valid, statut: "appliquee" })).toThrow();
  });
});

describe("avancementExceptionnelInputSchema", () => {
  it("limite à 1 ou 2 échelons (422 au-delà)", () => {
    const base = { agent_id: 1, motif: "Résultats remarquables sur l'exercice." };
    expect(avancementExceptionnelInputSchema.parse({ ...base, nb_echelons: 2 }).nb_echelons).toBe(2);
    expect(() => avancementExceptionnelInputSchema.parse({ ...base, nb_echelons: 3 })).toThrow();
    expect(() => avancementExceptionnelInputSchema.parse({ ...base, nb_echelons: 0 })).toThrow();
  });

  it("exige un motif de 10 caractères minimum", () => {
    expect(() => avancementExceptionnelInputSchema.parse({ agent_id: 1, nb_echelons: 1, motif: "court" })).toThrow();
  });
});
