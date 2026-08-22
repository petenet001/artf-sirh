import { describe, it, expect } from "vitest";
import { ENTITE_LABEL, estPosteResponsable, estStructurable } from "./entite";

describe("estPosteResponsable", () => {
  it("reconnaît les intitulés de direction, quelle que soit la casse ou les accents", () => {
    expect(estPosteResponsable("Directeur Général")).toBe(true);
    expect(estPosteResponsable("directrice generale")).toBe(true);
    expect(estPosteResponsable("Chef de service Comptabilité")).toBe(true);
    expect(estPosteResponsable("CHEF DE BUREAU")).toBe(true);
    expect(estPosteResponsable("Responsable des achats")).toBe(true);
  });

  it("rejette un poste d'exécution ou une valeur absente", () => {
    expect(estPosteResponsable("Agent de saisie")).toBe(false);
    expect(estPosteResponsable("Comptable")).toBe(false);
    expect(estPosteResponsable("")).toBe(false);
    expect(estPosteResponsable(null)).toBe(false);
    expect(estPosteResponsable(undefined)).toBe(false);
  });
});

describe("estStructurable", () => {
  it("accepte les trois structures affectables", () => {
    expect(estStructurable("App\\Models\\Direction")).toBe(true);
    expect(estStructurable("App\\Models\\Service")).toBe(true);
    expect(estStructurable("App\\Models\\Bureau")).toBe(true);
  });

  it("rejette tout autre type", () => {
    expect(estStructurable("App\\Models\\Agent")).toBe(false);
    expect(estStructurable(null)).toBe(false);
  });
});

describe("ENTITE_LABEL", () => {
  it("donne un libellé lisible à chaque structure", () => {
    expect(ENTITE_LABEL["App\\Models\\Direction"]).toBe("Direction");
    expect(ENTITE_LABEL["App\\Models\\Service"]).toBe("Service");
    expect(ENTITE_LABEL["App\\Models\\Bureau"]).toBe("Bureau");
  });
});
