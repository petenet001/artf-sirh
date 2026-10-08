import { describe, expect, it } from "vitest";
import { suiteSaisieNote } from "./notation";

describe("suiteSaisieNote", () => {
  it("n'enregistre rien sur un critère laissé vide", () => {
    expect(suiteSaisieNote({ valeur: null, commentaire: "", bareme: 5 })).toBe("ignorer");
  });

  it("n'appelle pas l'API quand rien n'a changé", () => {
    expect(
      suiteSaisieNote({
        valeur: 3,
        commentaire: "Bon niveau",
        bareme: 5,
        initiale: { note_obtenue: 3, commentaire: "Bon niveau" },
      }),
    ).toBe("ignorer");
  });

  it("enregistre un commentaire modifié à note égale", () => {
    expect(
      suiteSaisieNote({
        valeur: 3,
        commentaire: "Progrès nets",
        bareme: 5,
        initiale: { note_obtenue: 3, commentaire: "Bon niveau" },
      }),
    ).toBe("enregistrer");
  });

  it("traite l'absence de commentaire et la chaîne vide de la même façon", () => {
    expect(
      suiteSaisieNote({ valeur: 3, commentaire: "", bareme: 5, initiale: { note_obtenue: 3, commentaire: null } }),
    ).toBe("ignorer");
  });

  it("enregistre une première note", () => {
    expect(suiteSaisieNote({ valeur: 4, commentaire: "", bareme: 5 })).toBe("enregistrer");
  });

  it("refuse localement une note au-dessus du barème", () => {
    expect(suiteSaisieNote({ valeur: 6, commentaire: "", bareme: 5 })).toBe("hors-bareme");
  });
});
