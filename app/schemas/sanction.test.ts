import { describe, it, expect } from "vitest";
import {
  sanctionSchema,
  sanctionInputSchema,
  instructionSanctionSchema,
  prononceSanctionSchema,
  classementSanctionSchema,
} from "./sanction";

describe("sanctionSchema", () => {
  const valid = {
    id: 1,
    agent_id: 12,
    type_sanction_id: 3,
    motif: "Absences répétées non justifiées.",
    date_faits: "2026-09-01",
    statut: "en_attente",
    statut_label: "Rapport soumis",
    prochaine_etape: "instruire",
  };

  it("valide un rapport déposé", () => {
    const parsed = sanctionSchema.parse(valid);
    expect(parsed.statut).toBe("en_attente");
    expect(parsed.prochaine_etape).toBe("instruire");
  });

  it("accepte l'étape `prononcer` (le DG seul prononce depuis la mise en conformité CCN)", () => {
    const parsed = sanctionSchema.parse({ ...valid, statut: "instruite", prochaine_etape: "prononcer" });
    expect(parsed.prochaine_etape).toBe("prononcer");
    // L'ancienne étape `valider` n'existe plus.
    expect(() => sanctionSchema.parse({ ...valid, prochaine_etape: "valider" })).toThrow();
  });

  it("accepte la conservation, la récidive et les antécédents", () => {
    const parsed = sanctionSchema.parse({
      ...valid,
      conservee_jusqu_au: "2031-09-01",
      dans_delai_conservation: true,
      recidive: true,
      antecedents_5_ans: [{ id: 4, type: "Blâme écrit", date_decision: "2024-03-02", motif: "Retards" }],
    });
    expect(parsed.recidive).toBe(true);
    expect(parsed.antecedents_5_ans?.[0]?.type).toBe("Blâme écrit");
  });

  it("tolère l'absence de notes_instruction (masquées pour l'agent concerné)", () => {
    expect(sanctionSchema.parse(valid).notes_instruction).toBeUndefined();
  });

  it("rejette un statut hors enum", () => {
    expect(() => sanctionSchema.parse({ ...valid, statut: "close" })).toThrow();
  });
});

describe("sanctionInputSchema", () => {
  it("exige agent, type, motif et date des faits", () => {
    expect(() =>
      sanctionInputSchema.parse({ agent_id: 1, type_sanction_id: 1, motif: "ab", date_faits: "2026-09-01" }),
    ).toThrow();
    const parsed = sanctionInputSchema.parse({
      agent_id: 1,
      type_sanction_id: 1,
      motif: "Faits établis.",
      date_faits: "2026-09-01",
    });
    expect(parsed.agent_id).toBe(1);
  });

  it("borne la mise à pied à 8 jours (art. 90)", () => {
    const base = { agent_id: 1, type_sanction_id: 1, motif: "Faits établis.", date_faits: "2026-09-01" };
    expect(sanctionInputSchema.parse({ ...base, nb_jours: 8 }).nb_jours).toBe(8);
    expect(() => sanctionInputSchema.parse({ ...base, nb_jours: 9 })).toThrow();
    expect(() => sanctionInputSchema.parse({ ...base, nb_jours: 0 })).toThrow();
  });
});

describe("payloads du circuit", () => {
  it("instruction : notes obligatoires, sanction proposée facultative", () => {
    expect(() => instructionSanctionSchema.parse({ notes_instruction: "ok" })).toThrow();
    expect(instructionSanctionSchema.parse({ notes_instruction: "Auditions menées." }).decision).toBeUndefined();
  });

  it("prononcé : décision obligatoire", () => {
    expect(() => prononceSanctionSchema.parse({ commentaire: "rien" })).toThrow();
    expect(prononceSanctionSchema.parse({ decision: "Mise à pied de 3 jours." }).decision).toBeTruthy();
  });

  it("classement : motif obligatoire (3 caractères min.)", () => {
    expect(() => classementSanctionSchema.parse({ commentaire: "no" })).toThrow();
    expect(classementSanctionSchema.parse({ commentaire: "Faits non établis." }).commentaire).toBeTruthy();
  });
});
