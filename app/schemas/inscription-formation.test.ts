import { describe, it, expect } from "vitest";
import { inscriptionFormationSchema, inscriptionFormationInputSchema } from "./inscription-formation";

describe("inscriptionFormationSchema", () => {
  const valid = {
    id: 1,
    agent_id: 12,
    formation_id: 3,
    plan_id: 2,
    date_inscription: "2026-09-01",
    statut: "inscrite",
    statut_label: "Inscrite",
    admission_sur_titre: false,
    rapport_remis: false,
  };

  it("valide une inscription", () => {
    expect(inscriptionFormationSchema.parse(valid).statut).toBe("inscrite");
  });

  it("accepte l'engagement de service calculé (art. 104)", () => {
    const parsed = inscriptionFormationSchema.parse({ ...valid, debit_jusqu_au: "2028-09-01" });
    expect(parsed.debit_jusqu_au).toBe("2028-09-01");
  });

  it("accepte la formation développée (l'API omet alors formation_id)", () => {
    const parsed = inscriptionFormationSchema.parse({
      id: 1,
      agent_id: 12,
      statut: "presente",
      formation: { id: 3, titre: "Gestion de projet", type_action: "perfectionnement", duree_max_mois: 9 },
    });
    expect(parsed.formation?.duree_max_mois).toBe(9);
    expect(parsed.formation_id).toBeUndefined();
  });

  it("rejette un statut hors enum", () => {
    expect(() => inscriptionFormationSchema.parse({ ...valid, statut: "reportee" })).toThrow();
  });
});

describe("inscriptionFormationInputSchema", () => {
  it("exige agent et formation, laisse le plan facultatif", () => {
    const parsed = inscriptionFormationInputSchema.parse({ agent_id: 1, formation_id: 3 });
    expect(parsed.plan_id).toBeUndefined();
  });

  it("n'envoie aucun champ calculé serveur", () => {
    const shape = inscriptionFormationInputSchema.shape;
    for (const champ of ["statut", "debit_jusqu_au", "rapport_remis"]) {
      expect(champ in shape).toBe(false);
    }
  });
});
