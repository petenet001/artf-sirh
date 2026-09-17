import { describe, it, expect } from "vitest";
import {
  sessionEvaluationSchema,
  sessionEvaluationInputSchema,
  statsSessionSchema,
} from "./session-evaluation";

describe("sessionEvaluationSchema", () => {
  const valid = {
    id: 3,
    debut_session: "2026-09-01",
    fin_session: null,
    statut: "ouverte",
    statut_label: "Ouverte",
    type_annee: null,
    semestre: null,
    description: "Notation 2026",
  };

  it("valide une session sans filtre d'éligibilité", () => {
    const parsed = sessionEvaluationSchema.parse(valid);
    expect(parsed.statut).toBe("ouverte");
    expect(parsed.type_annee).toBeNull();
  });

  it("accepte les compteurs quand l'API les charge", () => {
    const parsed = sessionEvaluationSchema.parse({ ...valid, nb_fiches_total: 45, nb_fiches_finalisees: 38 });
    expect(parsed.nb_fiches_total).toBe(45);
  });

  it("rejette une parité d'année inconnue", () => {
    expect(() => sessionEvaluationSchema.parse({ ...valid, type_annee: "bissextile" })).toThrow();
  });
});

describe("sessionEvaluationInputSchema", () => {
  it("exige la date de début", () => {
    expect(() => sessionEvaluationInputSchema.parse({ debut_session: "" })).toThrow();
    expect(sessionEvaluationInputSchema.parse({ debut_session: "2026-09-01" }).debut_session).toBe("2026-09-01");
  });
});

describe("statsSessionSchema", () => {
  it("valide des compteurs renseignés", () => {
    const parsed = statsSessionSchema.parse({
      session_id: 3,
      total: 45,
      par_statut: { finalisee: 38, en_validation_rh: 7 },
      moyenne: 14.72,
      mentions: { "Très bien": 18 },
    });
    expect(parsed.par_statut.finalisee).toBe(38);
  });

  it("ramène les maps PHP vides (sérialisées en tableau) à un objet", () => {
    const parsed = statsSessionSchema.parse({
      session_id: 4,
      total: 0,
      par_statut: [],
      moyenne: null,
      mentions: [],
    });
    expect(parsed.par_statut).toEqual({});
    expect(parsed.mentions).toEqual({});
    expect(parsed.moyenne).toBeNull();
  });
});
