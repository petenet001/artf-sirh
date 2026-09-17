import { describe, it, expect } from "vitest";
import { essaiSchema, alerteDelaiContratSchema } from "./essai";

describe("essaiSchema", () => {
  it("valide un essai en cours renouvelable", () => {
    const parsed = essaiSchema.parse({
      statut: "en_cours",
      statut_label: "En cours",
      duree_mois: 3,
      date_debut: "2026-09-01",
      date_fin: "2026-11-30",
      renouvele: false,
      prochaine_etape: "confirmer-essai",
      peut_renouveler: true,
    });
    expect(parsed.peut_renouveler).toBe(true);
    expect(parsed.prochaine_etape).toBe("confirmer-essai");
  });

  it("accepte `non_applicable` (stage, consultance)", () => {
    expect(essaiSchema.parse({ statut: "non_applicable", prochaine_etape: null }).statut).toBe("non_applicable");
  });

  it("rejette un statut hors enum", () => {
    expect(() => essaiSchema.parse({ statut: "termine" })).toThrow();
  });
});

describe("alerteDelaiContratSchema", () => {
  it("valide une ligne de la file des 30 jours (art. 52)", () => {
    const parsed = alerteDelaiContratSchema.parse({
      dossier_id: 4,
      reference: "INT-2026-004",
      agent_id: 12,
      agent: { id: 12, matricule: "AG012", nom: "DUPONT", prenom: "Jean", nom_complet: "Jean DUPONT" },
      type_integration: "Recrutement externe",
      date_prise_service: "2026-07-01",
      jours_ouvrables: 42,
    });
    expect(parsed.jours_ouvrables).toBe(42);
  });
});
