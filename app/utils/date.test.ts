import { describe, it, expect } from "vitest";
import {
  DATE_VIDE,
  formatDate,
  formatDateLong,
  formatDateRelative,
  formatDateTime,
  formatMoisAnnee,
  formatPeriode,
} from "./date";

describe("formatDate", () => {
  it("rend une date `Y-m-d` au format dense", () => {
    expect(formatDate("2026-08-15")).toBe("15/08/2026");
    expect(formatDate("2026-01-02")).toBe("02/01/2026");
  });

  it("ne décale pas le jour d'une date seule (piège du fuseau UTC)", () => {
    // `new Date("2026-08-15")` vaut minuit UTC : à l'ouest de Greenwich, un
    // formatage local afficherait le 14. La date seule est donc construite en
    // local — le jour affiché est toujours celui reçu.
    expect(formatDate("2026-08-15")).toContain("15");
    expect(formatDate("2026-03-01")).toBe("01/03/2026");
  });

  it("accepte un horodatage ISO complet", () => {
    expect(formatDate("2026-08-15T09:30:00.000000Z")).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it("renvoie le tiret pour une valeur absente ou illisible", () => {
    expect(formatDate(null)).toBe(DATE_VIDE);
    expect(formatDate(undefined)).toBe(DATE_VIDE);
    expect(formatDate("")).toBe(DATE_VIDE);
    expect(formatDate("pas une date")).toBe(DATE_VIDE);
  });
});

describe("formatDateLong / formatMoisAnnee", () => {
  it("écrit le mois en toutes lettres", () => {
    expect(formatDateLong("2026-08-15")).toBe("15 août 2026");
    expect(formatMoisAnnee("2026-08-15")).toBe("août 2026");
  });

  it("garde le tiret quand la valeur manque", () => {
    expect(formatDateLong(null)).toBe(DATE_VIDE);
    expect(formatMoisAnnee(null)).toBe(DATE_VIDE);
  });
});

describe("formatDateTime", () => {
  it("ajoute l'heure à la date", () => {
    expect(formatDateTime("2026-08-15T09:30:00")).toBe("15/08/2026 à 09:30");
  });

  it("garde le tiret quand la valeur manque", () => {
    expect(formatDateTime(null)).toBe(DATE_VIDE);
  });
});

describe("formatDateRelative", () => {
  const now = new Date("2026-08-15T12:00:00");

  it("exprime le passé récent en langage courant", () => {
    expect(formatDateRelative("2026-08-15T11:59:30", now)).toBe("à l'instant");
    expect(formatDateRelative("2026-08-15T11:30:00", now)).toBe("il y a 30 min");
    expect(formatDateRelative("2026-08-15T09:00:00", now)).toBe("il y a 3 h");
    expect(formatDateRelative("2026-08-14T10:00:00", now)).toBe("hier");
    expect(formatDateRelative("2026-08-10T12:00:00", now)).toBe("il y a 5 jours");
  });

  it("repasse à la date au-delà d'un mois", () => {
    expect(formatDateRelative("2026-01-10T12:00:00", now)).toBe("10/01/2026");
  });

  it("n'invente pas de « il y a » pour une date future", () => {
    expect(formatDateRelative("2026-09-01", now)).toBe("01/09/2026");
  });
});

describe("formatPeriode", () => {
  it("compose la période selon les bornes disponibles", () => {
    expect(formatPeriode("2026-08-15", "2026-09-20")).toBe("du 15/08/2026 au 20/09/2026");
    expect(formatPeriode("2026-08-15", null)).toBe("depuis le 15/08/2026");
    expect(formatPeriode(null, "2026-09-20")).toBe("jusqu'au 20/09/2026");
    expect(formatPeriode(null, null)).toBe(DATE_VIDE);
  });
});
