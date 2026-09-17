import { describe, it, expect } from "vitest";
import { positionConventionnelleSchema, positionConventionnelleInputSchema } from "./position-conventionnelle";

describe("positionConventionnelleSchema", () => {
  const valid = {
    id: 1,
    agent_id: 12,
    type: "detachement",
    type_label: "Détachement",
    article: "78",
    statut: "soumise",
    statut_label: "Soumise",
    prochaine_etape: "approuver",
    date_debut: "2026-12-16",
    date_fin: "2028-12-16",
    organisme_accueil: "Ministère des Finances",
    consentement_agent: true,
    coupe_remuneration: true,
  };

  it("valide un détachement soumis", () => {
    const parsed = positionConventionnelleSchema.parse(valid);
    expect(parsed.type).toBe("detachement");
    expect(parsed.coupe_remuneration).toBe(true);
  });

  it("accepte le signal de réintégration renvoyé à la clôture", () => {
    const parsed = positionConventionnelleSchema.parse({
      ...valid,
      statut: "cloturee",
      prochaine_etape: null,
      reintegration: { affectation_manquante: true },
    });
    expect(parsed.reintegration?.affectation_manquante).toBe(true);
  });

  it("rejette un type ou un statut hors enum", () => {
    expect(() => positionConventionnelleSchema.parse({ ...valid, type: "mutation" })).toThrow();
    expect(() => positionConventionnelleSchema.parse({ ...valid, statut: "en_cours" })).toThrow();
  });
});

describe("positionConventionnelleInputSchema", () => {
  it("exige agent, type et période complète", () => {
    expect(() =>
      positionConventionnelleInputSchema.parse({ agent_id: 1, type: "disponibilite", date_debut: "2026-01-01", date_fin: "" }),
    ).toThrow();
    const parsed = positionConventionnelleInputSchema.parse({
      agent_id: 1,
      type: "disponibilite",
      date_debut: "2026-01-01",
      date_fin: "2028-01-01",
    });
    expect(parsed.type).toBe("disponibilite");
  });
});
