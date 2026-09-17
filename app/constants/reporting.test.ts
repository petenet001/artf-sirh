import { describe, it, expect } from "vitest";
import type { AlerteReporting } from "~/schemas/reporting";
import { alertesAffichees, formatCompact, formatFCFA, VIZ, VIZ_ETAT } from "./reporting";

const alerte = (code: string, total: number): AlerteReporting => ({
  code,
  libelle: code,
  total,
  items: [],
});

describe("alertesAffichees", () => {
  it("écarte les contrôles sans anomalie : un zéro n'est pas une information", () => {
    const rendues = alertesAffichees([alerte("sans_n1", 0), alerte("poste_vacant", 3)]);
    expect(rendues.map((a) => a.code)).toEqual(["poste_vacant"]);
  });

  it("classe par gravité avant le volume", () => {
    const rendues = alertesAffichees([
      alerte("dossier_incomplet", 50),
      alerte("sans_affiliation_cnss", 2),
      alerte("sans_n1", 10),
    ]);
    // Une obligation réglementaire non remplie passe devant 50 dossiers incomplets.
    expect(rendues.map((a) => a.code)).toEqual(["sans_affiliation_cnss", "sans_n1", "dossier_incomplet"]);
  });

  it("départage deux alertes de même gravité par le volume", () => {
    const rendues = alertesAffichees([alerte("poste_vacant", 2), alerte("dossier_incomplet", 9)]);
    expect(rendues.map((a) => a.code)).toEqual(["dossier_incomplet", "poste_vacant"]);
  });

  it("donne à chaque alerte une couleur d'état, une icône et un écran où agir", () => {
    const [rendue] = alertesAffichees([alerte("sans_affiliation_cnss", 4)]);
    expect(rendue?.gravite).toBe("critique");
    expect(rendue?.couleur).toBe(VIZ_ETAT.critique);
    expect(rendue?.icone).toBeTruthy();
    expect(rendue?.lien).toBe("/affaires-sociales/affiliations");
    // Le sens ne repose jamais sur la couleur seule : un conseil l'accompagne.
    expect(rendue?.conseil).toContain("art. 47");
  });

  it("retombe sur « attention » pour un code inconnu plutôt que de disparaître", () => {
    const [rendue] = alertesAffichees([alerte("code_futur", 1)]);
    expect(rendue?.gravite).toBe("attention");
  });
});

describe("palette de visualisation", () => {
  it("n'utilise qu'une teinte pour une mesure unique", () => {
    expect(VIZ.serie).toBe("#0f4c81");
    expect(VIZ.piste).not.toBe(VIZ.serie);
  });

  it("réserve le gris à l'absence de donnée, hors des teintes de série", () => {
    expect(VIZ.categoriel).not.toContain(VIZ.neutre);
  });

  it("garde les couleurs d'état distinctes des couleurs de série", () => {
    for (const etat of Object.values(VIZ_ETAT)) {
      expect(VIZ.categoriel).not.toContain(etat);
      expect(etat).not.toBe(VIZ.serie);
    }
  });
});

describe("formats", () => {
  it("compacte au-delà du million, garde le détail en dessous", () => {
    expect(formatCompact(248)).toBe("248");
    expect(formatCompact(1284)).toMatch(/1\s?284/u);
    expect(formatCompact(84_500_000)).toMatch(/84,5\sM/u);
    expect(formatCompact(null)).toBe("—");
  });

  it("affiche les montants en francs", () => {
    expect(formatFCFA(84_500_000)).toMatch(/84\s?500\s?000\sF/u);
    expect(formatFCFA(null)).toBe("—");
  });
});
