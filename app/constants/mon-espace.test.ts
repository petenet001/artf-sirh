import { describe, it, expect } from "vitest";
import { cartesVisibles, CARTES_MON_ESPACE } from "./mon-espace";

/**
 * L'espace personnel obéit à deux conditions distinctes : un agent rattaché au
 * compte (sans lui l'API répond 403), et la permission de lecture du domaine.
 */
const PERMISSIONS_AGENT = [
  "consulter-referentiels",
  "consulter-conges",
  "creer-conges",
  "consulter-absences",
  "creer-absences",
  "consulter-evaluations",
];

const ctx = (estAgent: boolean, permissions: string[] = PERMISSIONS_AGENT) => ({
  estAgent,
  can: (p: string) => permissions.includes(p),
});

const cles = (c: Parameters<typeof cartesVisibles>[0]) => cartesVisibles(c).map((x) => x.key);

describe("cartesVisibles", () => {
  it("un agent voit tout son espace personnel", () => {
    expect(cles(ctx(true))).toEqual([
      "profil",
      "dossier",
      "carriere",
      "conges",
      "absences",
      "evaluations",
      "discipline",
    ]);
  });

  it("un compte sans agent rattaché ne garde que son profil", () => {
    // Ni congés, ni carrière, ni dossier : ces routes sont indexées par agent.
    expect(cles(ctx(false))).toEqual(["profil", "evaluations"]);
  });

  it("une carte disparaît si la permission de lecture manque", () => {
    const sansConges = ctx(true, ["consulter-absences", "consulter-evaluations"]);
    expect(cles(sansConges)).not.toContain("conges");
    expect(cles(sansConges)).toContain("absences");
  });

  it("le profil reste ouvert à tout compte, même sans permission", () => {
    expect(cles(ctx(false, []))).toEqual(["profil"]);
  });

  it("toutes les cartes pointent vers un écran personnel", () => {
    for (const carte of CARTES_MON_ESPACE) {
      expect(carte.to.startsWith("/mon-espace/") || ["/profil", "/evaluations/mes-evaluations"].includes(carte.to)).toBe(true);
    }
  });
});
