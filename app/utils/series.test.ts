import { describe, it, expect } from "vitest";
import { grilleMois, libelleMois, compterParMois } from "./series";

describe("grilleMois", () => {
  it("rend les N derniers mois, du plus ancien au plus récent, mois courant inclus", () => {
    const grille = grilleMois(4, new Date(2026, 8, 17)); // septembre 2026
    expect(grille.map((m) => m.cle)).toEqual(["2026-06", "2026-07", "2026-08", "2026-09"]);
    expect(grille.map((m) => m.libelle)).toEqual(["juin", "juil.", "août", "sept."]);
  });

  it("traverse le changement d'année", () => {
    const grille = grilleMois(3, new Date(2026, 1, 3)); // février 2026
    expect(grille.map((m) => m.cle)).toEqual(["2025-12", "2026-01", "2026-02"]);
  });

  it("zéro-remplit le mois sur deux chiffres pour rester triable à plat", () => {
    const cles = grilleMois(12, new Date(2026, 8, 1)).map((m) => m.cle);
    expect([...cles].sort()).toEqual(cles);
  });
});

describe("libelleMois", () => {
  it("rend le libellé court", () => {
    expect(libelleMois(1)).toBe("janv.");
    expect(libelleMois(12)).toBe("déc.");
  });

  it("retombe sur le numéro si le mois est hors bornes", () => {
    expect(libelleMois(13)).toBe("13");
  });
});

describe("compterParMois", () => {
  const grille = grilleMois(3, new Date(2026, 8, 17)); // juil. → sept. 2026

  it("compte les dates dans leur mois", () => {
    const points = compterParMois(["2026-07-02", "2026-07-30", "2026-09-01"], grille);
    expect(points.map((p) => p.valeur)).toEqual([2, 0, 1]);
  });

  it("garde à zéro un mois sans événement au lieu de le faire disparaître", () => {
    const points = compterParMois([], grille);
    expect(points).toHaveLength(3);
    expect(points.every((p) => p.valeur === 0)).toBe(true);
  });

  it("ignore les dates hors fenêtre au lieu de les rattacher au mois voisin", () => {
    const points = compterParMois(["2025-01-15", "2030-12-31"], grille);
    expect(points.map((p) => p.valeur)).toEqual([0, 0, 0]);
  });

  it("ignore une date absente ou illisible", () => {
    const points = compterParMois([null, undefined, "", "2026", "2026-08-10"], grille);
    expect(points.map((p) => p.valeur)).toEqual([0, 1, 0]);
  });

  it("affecte un congé à son mois de début, pas à ses mois traversés", () => {
    // Congé du 30 juillet au 12 août : compté une fois, en juillet.
    const points = compterParMois(["2026-07-30"], grille);
    expect(points.map((p) => p.valeur)).toEqual([1, 0, 0]);
  });
});
