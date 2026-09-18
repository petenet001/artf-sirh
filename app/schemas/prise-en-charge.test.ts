import { describe, it, expect } from "vitest";
import { priseEnChargeSchema, priseEnChargeInputSchema } from "./prise-en-charge";

describe("priseEnChargeSchema", () => {
  const base = {
    id: 5,
    agent_id: 12,
    type: "hospitalisation",
    type_label: "Hospitalisation",
    article_ccn: "art. 125",
    statut: "instruite",
    prochaine_etape: "accorder",
    date_soins: "2026-06-10",
    structure_sanitaire_id: 2,
  };

  it("valide une prise en charge de liste", () => {
    expect(priseEnChargeSchema.parse(base).type).toBe("hospitalisation");
  });

  it("distingue le montant facturé du montant accordé", () => {
    const p = priseEnChargeSchema.parse({
      ...base,
      montant_facture: 800_000,
      montant_calcule: 640_000,
      montant_accorde: 640_000,
    });
    expect(p.montant_facture).toBe(800_000);
    expect(p.montant_accorde).toBe(640_000);
  });

  it("porte le drapeau AT/MP et la structure développée", () => {
    const p = priseEnChargeSchema.parse({
      ...base,
      at_mp: true,
      structure: { id: 2, nom: "CHU de Brazzaville", type: "formation_sanitaire" },
    });
    expect(p.at_mp).toBe(true);
    expect(p.structure?.nom).toBe("CHU de Brazzaville");
  });

  it("accepte des soins pour un ayant droit", () => {
    expect(priseEnChargeSchema.parse({ ...base, ayant_droit_id: 9 }).ayant_droit_id).toBe(9);
  });

  it("refuse un type de frais hors CCN", () => {
    expect(() => priseEnChargeSchema.parse({ ...base, type: "chirurgie_esthetique" })).toThrow();
  });
});

describe("priseEnChargeInputSchema", () => {
  const base = {
    agent_id: 12,
    type: "pharmaceutique",
    date_soins: "2026-06-10",
    structure_sanitaire_id: 2,
  };

  it("valide le minimum exigé par l'API", () => {
    expect(priseEnChargeInputSchema.parse(base).type).toBe("pharmaceutique");
  });

  it("refuse un montant facturé nul", () => {
    expect(() => priseEnChargeInputSchema.parse({ ...base, montant_facture: 0 })).toThrow();
  });

  it("laisse les dates de séjour facultatives : des soins ponctuels n'en ont pas", () => {
    const p = priseEnChargeInputSchema.parse(base);
    expect(p.date_debut).toBeUndefined();
    expect(p.date_fin).toBeUndefined();
  });
});
