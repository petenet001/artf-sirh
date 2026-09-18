import { describe, it, expect } from "vitest";
import { prestationSchema, prestationInputSchema } from "./prestation";

describe("prestationSchema", () => {
  const liste = {
    id: 7,
    agent_id: 12,
    type: "capital_deces",
    type_label: "Capital décès",
    article_ccn: "art. 121",
    statut: "instruite",
    statut_label: "Instruite",
    prochaine_etape: "accorder",
    date_fait: "2026-08-02",
  };

  it("valide une prestation telle que renvoyée en liste", () => {
    const p = prestationSchema.parse(liste);
    expect(p.type).toBe("capital_deces");
    expect(p.prochaine_etape).toBe("accorder");
  });

  it("accepte les relations absentes : elles ne sont chargées que sur le show", () => {
    const p = prestationSchema.parse(liste);
    expect(p.agent).toBeUndefined();
    expect(p.pieces).toBeUndefined();
    expect(p.decideur).toBeUndefined();
  });

  it("valide une fiche complète, pièces et intervenants compris", () => {
    const p = prestationSchema.parse({
      ...liste,
      statut: "accordee",
      prochaine_etape: null,
      agent: { id: 12, matricule: "A-0012", nom: "Ndinga", prenom: "Sylvie", nom_complet: "Sylvie Ndinga" },
      ayant_droit: { id: 3, nom: "Ndinga", prenom: "Léa", type: "enfant" },
      montant_calcule: 4_500_000,
      montant_accorde: 4_500_000,
      calcul_snapshot: { mois: 9, base: 500_000 },
      decideur: { id: 2, name: "DG" },
      paie_annee: 2026,
      paie_mois: 9,
      paie_element_affectation_id: 44,
      pieces: [{ id: 1, type_piece: "acte_deces", type_piece_label: "Acte de décès", nom_original: "acte.pdf" }],
    });
    expect(p.pieces?.[0]?.type_piece).toBe("acte_deces");
    expect(p.montant_accorde).toBe(4_500_000);
  });

  it("refuse un type de prestation hors CCN", () => {
    expect(() => prestationSchema.parse({ ...liste, type: "prime_de_these" })).toThrow();
  });

  it("refuse une étape que le circuit ne connaît pas", () => {
    expect(() => prestationSchema.parse({ ...liste, prochaine_etape: "signer" })).toThrow();
  });

  it("accepte `prochaine_etape: null` — circuit terminé", () => {
    expect(prestationSchema.parse({ ...liste, prochaine_etape: null }).prochaine_etape).toBeNull();
  });
});

describe("prestationInputSchema", () => {
  const base = { agent_id: 12, type: "frais_funeraires", date_fait: "2026-08-02" };

  it("valide le minimum exigé par l'API", () => {
    expect(prestationInputSchema.parse(base).agent_id).toBe(12);
  });

  it("accepte le bénéficiaire nommé à la main, sans ayant droit enregistré", () => {
    const p = prestationInputSchema.parse({ ...base, beneficiaire_libelle: "Mme Ndinga, veuve" });
    expect(p.beneficiaire_libelle).toBe("Mme Ndinga, veuve");
  });

  it("accepte le drapeau transport du corps", () => {
    expect(prestationInputSchema.parse({ ...base, transport_corps: true }).transport_corps).toBe(true);
  });

  it("refuse un montant nul ou négatif", () => {
    expect(() => prestationInputSchema.parse({ ...base, montant_demande: 0 })).toThrow();
    expect(() => prestationInputSchema.parse({ ...base, montant_demande: -1 })).toThrow();
  });

  it("refuse une date de fait vide", () => {
    expect(() => prestationInputSchema.parse({ ...base, date_fait: "" })).toThrow();
  });

  it("ne plafonne pas les frais funéraires côté front : le plafond CCN appartient au serveur", () => {
    // 2 000 000 F est la limite légale ; le front ne la duplique pas, elle peut
    // bouger avec la convention. C'est l'API qui répond 422.
    expect(prestationInputSchema.parse({ ...base, montant_demande: 9_000_000 }).montant_demande).toBe(9_000_000);
  });
});
