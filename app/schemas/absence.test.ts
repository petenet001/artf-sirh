import { describe, it, expect } from "vitest";
import { absenceSchema, absenceInputSchema, rejetAbsenceSchema } from "./absence";

describe("absenceSchema", () => {
  const valid = {
    id: 1,
    agent_id: 12,
    type_absence_id: 2,
    date_debut: "2026-09-07",
    date_fin: "2026-09-08",
    nb_jours: 2,
    justifiee: true,
    motif: "Maladie",
    statut: "en_attente",
    statut_label: "En attente",
  };

  it("valide une absence correcte", () => {
    const parsed = absenceSchema.parse(valid);
    expect(parsed.statut).toBe("en_attente");
    expect(parsed.justifiee).toBe(true);
  });

  it("rejette un statut hors enum", () => {
    expect(() => absenceSchema.parse({ ...valid, statut: "soumise" })).toThrow();
  });

  it("absenceInputSchema valide un payload minimal", () => {
    const parsed = absenceInputSchema.parse({
      agent_id: 12,
      type_absence_id: 2,
      date_debut: "2026-09-07",
      date_fin: "2026-09-08",
    });
    expect(parsed.agent_id).toBe(12);
  });
});

describe("rejetAbsenceSchema", () => {
  it("exige un commentaire", () => {
    expect(() => rejetAbsenceSchema.parse({ commentaire: "" })).toThrow();
    expect(rejetAbsenceSchema.parse({ commentaire: "Non justifiée" }).commentaire).toBe("Non justifiée");
  });
});
