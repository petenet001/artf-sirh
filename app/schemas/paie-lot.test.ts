import { describe, it, expect } from "vitest";
import { paieLotSchema, paieLotLigneSchema, paieLotInputSchema } from "./paie-lot";

describe("paieLotSchema", () => {
  const valid = {
    id: 1,
    annee: 2026,
    mois: 3,
    periode: "2026-03",
    periode_label: "mars 2026",
    statut: "genere",
    statut_label: "Généré",
    actions: { generer: true, controler: true, valider: false, cloturer: false, supprimer: true, exporter: false, modifier: true },
    anomalies: [{ code: "sans_base", severite: "bloquante", agent_id: 12, message: "Aucun salaire de base." }],
    nb_anomalies: 1,
    nb_anomalies_bloquantes: 1,
    total_gains: 1200000,
    total_retenues: 80000,
    total_net: 1120000,
    nb_lignes: 42,
  };

  it("valide un lot généré avec ses actions et ses anomalies", () => {
    const parsed = paieLotSchema.parse(valid);
    expect(parsed.actions?.generer).toBe(true);
    expect(parsed.anomalies?.[0]?.severite).toBe("bloquante");
    expect(parsed.total_net).toBe(1120000);
  });

  it("rejette un statut hors enum", () => {
    expect(() => paieLotSchema.parse({ ...valid, statut: "paye" })).toThrow();
  });
});

describe("paieLotInputSchema", () => {
  it("borne le mois et l'année", () => {
    expect(() => paieLotInputSchema.parse({ annee: 2026, mois: 13 })).toThrow();
    expect(() => paieLotInputSchema.parse({ annee: 1999, mois: 1 })).toThrow();
    expect(paieLotInputSchema.parse({ annee: 2026, mois: 3 }).mois).toBe(3);
  });
});

describe("paieLotLigneSchema", () => {
  it("valide une ligne et ses détails", () => {
    const parsed = paieLotLigneSchema.parse({
      id: 5,
      lot_id: 1,
      agent_id: 12,
      hors_grille: false,
      montant_base: 300000,
      total_gains: 350000,
      total_retenues: 20000,
      montant_net: 330000,
      details: [
        { code: "salaire_base", libelle: "Salaire de base", sens: "gain", montant: 300000, source: "base" },
        { code: "prime_anciennete", libelle: "Prime d'ancienneté", sens: "gain", montant: 50000, source: "calcul_auto" },
        { code: "retenue_cnss", libelle: "Retenue CNSS", sens: "retenue", montant: 20000, source: "calcul_auto" },
      ],
    });
    expect(parsed.details?.filter((d) => d.sens === "gain")).toHaveLength(2);
    expect(parsed.details?.[1]?.source).toBe("calcul_auto");
  });

  it("accepte une ligne hors grille (base à zéro, art. 55)", () => {
    const parsed = paieLotLigneSchema.parse({
      id: 6,
      agent_id: 13,
      hors_grille: true,
      montant_base: 0,
      total_gains: 900000,
      total_retenues: 0,
      montant_net: 900000,
      snapshot_agent: { matricule: "AG013", classe: "Hors classe" },
    });
    expect(parsed.hors_grille).toBe(true);
    expect(parsed.montant_base).toBe(0);
  });
});
