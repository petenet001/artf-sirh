import { describe, it, expect } from "vitest";
import { reclassementSchema, reclassementInputSchema } from "./reclassement";

describe("reclassementSchema", () => {
  const valid = {
    id: 1,
    agent_id: 12,
    type: "reclassement_formation",
    type_label: "Reclassement après formation (art. 73)",
    article: "73",
    statut: "soumis",
    statut_label: "Soumis",
    prochaine_etape: "approuver",
    motif: "Obtention d'une licence professionnelle.",
  };

  it("valide un dossier de liste", () => {
    const parsed = reclassementSchema.parse(valid);
    expect(parsed.type).toBe("reclassement_formation");
    expect(parsed.article).toBe("73");
  });

  it("accepte les classes résumées et le contexte calculé du show", () => {
    const parsed = reclassementSchema.parse({
      ...valid,
      classe_origine: { id: 3, categorie: "Cadres", grade: "B2", coefficient: "180" },
      classe_cible: { id: 4, categorie: "Cadres", grade: "B3", coefficient: 210 },
      age_ans: 38,
      anciennete_ans: "12",
      annees_dans_classe: 4,
      eligibilite: { ok: false, messages: ["Ancienneté insuffisante dans la classe."] },
    });
    expect(parsed.classe_origine?.coefficient).toBe(180);
    expect(parsed.anciennete_ans).toBe(12);
    expect(parsed.eligibilite?.ok).toBe(false);
  });

  it("accepte une reconversion avec son motif réglementaire (art. 75)", () => {
    const parsed = reclassementSchema.parse({
      ...valid,
      type: "reconversion",
      motif_reconversion: "maladie",
      piece_path: "CM-2026-014",
    });
    expect(parsed.motif_reconversion).toBe("maladie");
  });

  it("accepte prochaine_etape null (dossier clos)", () => {
    expect(reclassementSchema.parse({ ...valid, statut: "applique", prochaine_etape: null }).prochaine_etape).toBeNull();
  });

  it("rejette un type, un statut ou un motif hors enum", () => {
    expect(() => reclassementSchema.parse({ ...valid, type: "promotion" })).toThrow();
    expect(() => reclassementSchema.parse({ ...valid, statut: "en_cours" })).toThrow();
    expect(() => reclassementSchema.parse({ ...valid, motif_reconversion: "mutation" })).toThrow();
  });
});

describe("reclassementInputSchema", () => {
  it("exige un motif de 10 caractères minimum", () => {
    expect(() =>
      reclassementInputSchema.parse({ agent_id: 1, type: "hors_classe", motif: "court" }),
    ).toThrow();
  });

  it("laisse les champs conditionnels facultatifs (le backend tranche par type)", () => {
    const parsed = reclassementInputSchema.parse({
      agent_id: 1,
      type: "hors_classe",
      motif: "Ancienneté exceptionnelle dans la classe.",
    });
    expect(parsed.diplome_id).toBeUndefined();
    expect(parsed.classe_cible_id).toBeUndefined();
  });

  it("n'envoie aucun champ calculé serveur", () => {
    const shape = reclassementInputSchema.shape;
    for (const champ of ["age_ans", "anciennete_ans", "annees_dans_classe", "statut", "eligibilite"]) {
      expect(champ in shape).toBe(false);
    }
  });
});
