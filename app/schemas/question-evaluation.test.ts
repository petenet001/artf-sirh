import { describe, it, expect } from "vitest";
import { questionEvaluationSchema, questionEvaluationInputSchema } from "./question-evaluation";

describe("questionEvaluationSchema", () => {
  const valid = {
    id: 1,
    libelle: "Connaissance technique du poste",
    type_critere: "competence_pro",
    bareme_max: 1,
    ordre: 1,
    actif: true,
  };

  it("valide un critère de la grille", () => {
    expect(questionEvaluationSchema.parse(valid).type_critere).toBe("competence_pro");
  });

  it("accepte un barème sérialisé en chaîne (decimal Laravel)", () => {
    expect(questionEvaluationSchema.parse({ ...valid, bareme_max: "0.50" }).bareme_max).toBe(0.5);
  });

  it("rejette une famille de critère inconnue", () => {
    expect(() => questionEvaluationSchema.parse({ ...valid, type_critere: "ponctualite" })).toThrow();
  });
});

describe("questionEvaluationInputSchema", () => {
  it("borne le barème à l'intervalle accepté par l'API (0,5 – 20)", () => {
    const base = { libelle: "Critère", type_critere: "assiduite" as const };
    expect(() => questionEvaluationInputSchema.parse({ ...base, bareme_max: 0.2 })).toThrow();
    expect(() => questionEvaluationInputSchema.parse({ ...base, bareme_max: 25 })).toThrow();
    expect(questionEvaluationInputSchema.parse({ ...base, bareme_max: 3 }).bareme_max).toBe(3);
  });

  it("exige un libellé", () => {
    expect(() =>
      questionEvaluationInputSchema.parse({ libelle: "", type_critere: "assiduite", bareme_max: 3 }),
    ).toThrow();
  });
});
