import { describe, it, expect } from "vitest";
import { noteEvaluationSchema, noteEvaluationInputSchema } from "./note-evaluation";

describe("noteEvaluationSchema", () => {
  it("valide une note avec son critère", () => {
    const parsed = noteEvaluationSchema.parse({
      id: 7,
      evaluation_id: 1,
      question_id: 3,
      note_obtenue: "0.80",
      commentaire: "Très bon niveau",
      question: { id: 3, libelle: "Rigueur", type_critere: "competence_pro", bareme_max: 1 },
    });
    expect(parsed.note_obtenue).toBe(0.8);
    expect(parsed.question?.libelle).toBe("Rigueur");
  });

  it("accepte une note nue (liste sans expansion)", () => {
    expect(noteEvaluationSchema.parse({ question_id: 1, note_obtenue: 2 }).question).toBeUndefined();
  });
});

describe("noteEvaluationInputSchema", () => {
  it("refuse une note négative", () => {
    expect(() => noteEvaluationInputSchema.parse({ question_id: 1, note_obtenue: -1 })).toThrow();
  });

  it("garde le commentaire facultatif", () => {
    expect(noteEvaluationInputSchema.parse({ question_id: 1, note_obtenue: 1 }).commentaire).toBeUndefined();
  });
});
