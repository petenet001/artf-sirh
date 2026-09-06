import { describe, it, expect } from "vitest";
import { carriereDepuisDiplome, classeDuDiplome } from "./carriere";
import type { Diplome } from "~/schemas/diplome";
import type { Classegrillesalariale } from "~/schemas/classegrillesalariale";
import type { Echelon } from "~/schemas/echelon";

const classes: Classegrillesalariale[] = [
  { id: 7, coefficient: 105, categorie: { id: 70, nom: "Classe VII" }, grade: { id: 700, nom: "Vérificateur" } },
  { id: 8, coefficient: 120, categorie: { id: 80, nom: "Classe VIII" }, grade: { id: 800, nom: "Inspecteur" } },
];

const echelons: Echelon[] = [
  { id: 31, nom: "Échelon 1", numero: 1 },
  { id: 32, nom: "Échelon 2", numero: 2 },
];

const licence: Diplome = { id: 20, nom: "Licence", classegrillesalariale_id: 7 };

describe("classeDuDiplome", () => {
  it("rapproche le diplôme de sa classe de grille", () => {
    expect(classeDuDiplome(licence, classes)?.id).toBe(7);
  });

  it("rend null si le diplôme n'est rattaché à aucune classe", () => {
    expect(classeDuDiplome({ id: 1, nom: "CEPE" }, classes)).toBeNull();
  });

  it("rend null si la classe référencée est absente de la grille", () => {
    expect(classeDuDiplome({ id: 1, nom: "X", classegrillesalariale_id: 99 }, classes)).toBeNull();
  });
});

describe("carriereDepuisDiplome", () => {
  it("déduit catégorie, grade et échelon 1", () => {
    expect(carriereDepuisDiplome(licence, classes, echelons)).toEqual({
      categorieId: 70,
      gradeId: 700,
      echelonId: 31,
      categorieLabel: "Classe VII",
      gradeLabel: "Vérificateur",
      echelonLabel: "Échelon 1",
    });
  });

  it("rend null sans diplôme, ou si la donnée manque", () => {
    expect(carriereDepuisDiplome(null, classes, echelons)).toBeNull();
    expect(carriereDepuisDiplome({ id: 1, nom: "CEPE" }, classes, echelons)).toBeNull();
    expect(carriereDepuisDiplome(licence, [], echelons)).toBeNull();
  });

  it("utilise l'expansion serveur `classe_grille` si l'API la renvoie un jour", () => {
    const avecExpansion: Diplome = {
      id: 30,
      nom: "Master",
      classe_grille: { id: 8, coefficient: 120, categorie: "Classe VIII", categorie_id: 80, grade: "Inspecteur", grade_id: 800 },
    };

    expect(carriereDepuisDiplome(avecExpansion, [], echelons)).toMatchObject({
      categorieId: 80,
      gradeId: 800,
      echelonId: 31,
    });
  });

  it("ne bloque pas si l'échelon 1 est introuvable", () => {
    expect(carriereDepuisDiplome(licence, classes, [])).toMatchObject({
      echelonId: null,
      echelonLabel: null,
      gradeId: 700,
    });
  });
});
