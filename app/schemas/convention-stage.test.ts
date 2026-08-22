import { describe, it, expect } from "vitest";
import {
  conventionStageSchema,
  stageProlongerSchema,
  stageCloturerSchema,
} from "./convention-stage";

/** Reflète ConventionStageResource + Stage/*Request. */
describe("conventionStageSchema", () => {
  const valid = {
    id: 1,
    type_stage: "professionnel",
    type_stage_label: "Stage professionnel",
    etablissement: "Université Marien Ngouabi",
    date_debut: "2026-01-10",
    date_fin: "2026-07-10",
    statut_stage: "EN_COURS",
    statut_stage_label: "En cours",
    note_finale: null,
    appreciation: null,
    jours_avant_fin: 42,
    agent_id: 12,
  };

  it("valide une convention de stage correcte", () => {
    const parsed = conventionStageSchema.parse(valid);
    expect(parsed.type_stage).toBe("professionnel");
    expect(parsed.statut_stage).toBe("EN_COURS");
  });

  it("rejette un statut de stage hors enum", () => {
    expect(() => conventionStageSchema.parse({ ...valid, statut_stage: "SUSPENDU" })).toThrow();
  });

  it("prolonger exige une date de fin", () => {
    expect(() => stageProlongerSchema.parse({})).toThrow();
    expect(stageProlongerSchema.parse({ date_fin: "2026-09-01" }).date_fin).toBe("2026-09-01");
  });

  it("cloturer exige note (0-20) et appréciation (min 10)", () => {
    expect(() => stageCloturerSchema.parse({ note: 25, appreciation: "trop court" })).toThrow();
    const parsed = stageCloturerSchema.parse({ note: 15, appreciation: "Très bon stagiaire, sérieux." });
    expect(parsed.note).toBe(15);
  });
});
