import { describe, it, expect } from "vitest";
import { paieElementSchema, paieElementInputSchema } from "./paie-element";

describe("paieElementSchema", () => {
  const valid = {
    id: 1,
    code: "prime_anciennete",
    libelle: "Prime d'ancienneté",
    nature: "prime",
    sens: "gain",
    periodicite: "mensuel",
    mode_calcul: "formule_ccn",
    montant_defaut: null,
    taux_defaut: null,
    article_ccn: "56",
    actif: true,
    systeme: true,
    a_parametrer: false,
  };

  it("valide un élément conventionnel", () => {
    const parsed = paieElementSchema.parse(valid);
    expect(parsed.systeme).toBe(true);
    // Montant et taux restent nuls tant que le comité n'a rien fixé.
    expect(parsed.montant_defaut).toBeNull();
  });

  it("accepte les sigles de fonction et les mois de déclenchement", () => {
    const parsed = paieElementSchema.parse({
      ...valid,
      code: "indemnite_representation",
      fonction_sigles: ["DD"],
      mois_declenchement: [6, 12],
    });
    expect(parsed.fonction_sigles).toEqual(["DD"]);
    expect(parsed.mois_declenchement).toEqual([6, 12]);
  });

  it("rejette une nature ou un mode de calcul hors enum", () => {
    expect(() => paieElementSchema.parse({ ...valid, nature: "bonus" })).toThrow();
    expect(() => paieElementSchema.parse({ ...valid, mode_calcul: "manuel" })).toThrow();
  });
});

describe("paieElementInputSchema", () => {
  const base = {
    libelle: "Retenue avance",
    nature: "retenue" as const,
    periodicite: "ponctuel" as const,
    mode_calcul: "montant_fixe" as const,
  };

  it("impose un code en minuscules avec tirets bas", () => {
    expect(paieElementInputSchema.parse({ ...base, code: "retenue_avance" }).code).toBe("retenue_avance");
    expect(() => paieElementInputSchema.parse({ ...base, code: "Retenue-Avance" })).toThrow();
    expect(() => paieElementInputSchema.parse({ ...base, code: "2retenue" })).toThrow();
  });

  it("ne laisse pas saisir le sens : il découle de la nature", () => {
    expect("sens" in paieElementInputSchema.shape).toBe(false);
  });

  it("borne le taux à 100 %", () => {
    expect(() => paieElementInputSchema.parse({ ...base, code: "retenue_x", taux_defaut: 120 })).toThrow();
  });
});
