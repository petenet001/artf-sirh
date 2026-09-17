import { describe, it, expect } from "vitest";
import { catalogueFormationSchema, catalogueFormationInputSchema } from "./catalogue-formation";

describe("catalogueFormationSchema", () => {
  const valid = {
    id: 3,
    titre: "Gestion de projet",
    type_action: "perfectionnement",
    type_action_label: "Perfectionnement",
    modalite: "externe",
    duree_jours: 20,
    duree_max_mois: 9,
    anciennete_min_ans: 3,
    actif: true,
  };

  it("valide une action de formation avec son plafond réglementaire", () => {
    const parsed = catalogueFormationSchema.parse(valid);
    // Art. 99 : le perfectionnement ne dépasse pas 9 mois.
    expect(parsed.duree_max_mois).toBe(9);
  });

  it("accepte un coût sérialisé en chaîne (decimal Laravel)", () => {
    expect(catalogueFormationSchema.parse({ ...valid, cout: "1500.00" }).cout).toBe(1500);
  });

  it("rejette un type d'action ou une modalité hors enum", () => {
    expect(() => catalogueFormationSchema.parse({ ...valid, type_action: "tutorat" })).toThrow();
    expect(() => catalogueFormationSchema.parse({ ...valid, modalite: "hybride" })).toThrow();
  });
});

describe("catalogueFormationInputSchema", () => {
  it("exige un titre, un type d'action et une durée", () => {
    expect(() => catalogueFormationInputSchema.parse({ titre: "", type_action: "seminaire", duree_jours: 2 })).toThrow();
    expect(() => catalogueFormationInputSchema.parse({ titre: "Séminaire", type_action: "seminaire", duree_jours: 0 })).toThrow();
    expect(
      catalogueFormationInputSchema.parse({ titre: "Séminaire", type_action: "seminaire", duree_jours: 2 }).duree_jours,
    ).toBe(2);
  });

  it("borne l'ancienneté minimale et l'engagement de service", () => {
    const base = { titre: "École", type_action: "ecole" as const, duree_jours: 300 };
    expect(() => catalogueFormationInputSchema.parse({ ...base, anciennete_min_ans: 11 })).toThrow();
    expect(() => catalogueFormationInputSchema.parse({ ...base, debit_formation_mois: 61 })).toThrow();
  });
});
