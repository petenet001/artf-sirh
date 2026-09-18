import { describe, it, expect } from "vitest";
import {
  actionsDossierSocial,
  dossierClos,
  dossierModifiable,
  montantSaisi,
  prestationDeDeces,
  origineProfessionnelle,
  priseEnChargeAvecSejour,
  formatMontant,
  STATUT_DOSSIER_SOCIAL_COLOR,
  TYPE_PRESTATION_LABEL,
  ARTICLE_PRESTATION,
} from "./dossiers-sociaux";
import { STATUTS_DOSSIER_SOCIAL, TYPES_PRESTATION } from "./enums";

const gestionnaire = { peutGerer: true, peutDecider: false };
const decideur = { peutGerer: false, peutDecider: true };
const lecteur = { peutGerer: false, peutDecider: false };

const cles = (actions: { cle: string }[]) => actions.map((a) => a.cle);

describe("actionsDossierSocial", () => {
  it("propose « soumettre » au gestionnaire sur un brouillon", () => {
    const d = { statut: "brouillon" as const, prochaine_etape: "soumettre" as const };
    expect(cles(actionsDossierSocial(d, gestionnaire))).toEqual(["soumettre", "classer"]);
  });

  it("ne propose rien d'actif à un simple lecteur", () => {
    const d = { statut: "brouillon" as const, prochaine_etape: "soumettre" as const };
    expect(actionsDossierSocial(d, lecteur)).toEqual([]);
  });

  it("réserve accorder/refuser au décideur, jamais au gestionnaire", () => {
    const d = { statut: "instruite" as const, prochaine_etape: "accorder" as const };
    expect(cles(actionsDossierSocial(d, decideur))).toEqual(["accorder", "refuser"]);
    // Le gestionnaire voit le dossier mais ne décide pas : il ne lui reste que le classement.
    expect(cles(actionsDossierSocial(d, gestionnaire))).toEqual(["classer"]);
  });

  it("suit `prochaine_etape` et non le statut", () => {
    // Statut avancé mais circuit déclaré terminé par le serveur : aucune transition.
    const d = { statut: "instruite" as const, prochaine_etape: null };
    expect(cles(actionsDossierSocial(d, decideur))).toEqual([]);
  });

  it("n'offre plus le classement une fois le dossier clos", () => {
    for (const statut of ["accordee", "refusee", "classee"] as const) {
      const d = { statut, prochaine_etape: null };
      expect(actionsDossierSocial(d, gestionnaire)).toEqual([]);
    }
  });

  it("cumule la décision et le classement pour qui a les deux droits", () => {
    const d = { statut: "instruite" as const, prochaine_etape: "accorder" as const };
    const actions = cles(actionsDossierSocial(d, { peutGerer: true, peutDecider: true }));
    expect(actions).toEqual(["accorder", "refuser", "classer"]);
  });
});

describe("état du dossier", () => {
  it("n'est modifiable qu'en brouillon", () => {
    expect(dossierModifiable("brouillon")).toBe(true);
    for (const s of STATUTS_DOSSIER_SOCIAL.filter((s) => s !== "brouillon")) {
      expect(dossierModifiable(s)).toBe(false);
    }
  });

  it("est clos après décision ou classement", () => {
    expect(dossierClos("accordee")).toBe(true);
    expect(dossierClos("refusee")).toBe(true);
    expect(dossierClos("classee")).toBe(true);
    expect(dossierClos("soumise")).toBe(false);
    expect(dossierClos(null)).toBe(false);
  });

  it("donne une couleur neutre au classement, jamais une couleur d'échec", () => {
    expect(STATUT_DOSSIER_SOCIAL_COLOR.classee).toBe("neutral");
    expect(STATUT_DOSSIER_SOCIAL_COLOR.refusee).toBe("error");
  });
});

describe("prestations", () => {
  it("couvre tous les types du backend, avec leur article CCN", () => {
    for (const type of TYPES_PRESTATION) {
      expect(TYPE_PRESTATION_LABEL[type]).toBeTruthy();
      expect(ARTICLE_PRESTATION[type]).toMatch(/^art\. \d+$/);
    }
  });

  it("n'ouvre la saisie du montant que pour les frais funéraires", () => {
    expect(montantSaisi("frais_funeraires")).toBe(true);
    expect(montantSaisi("capital_deces")).toBe(false);
    expect(montantSaisi("indemnite_retraite")).toBe(false);
    expect(montantSaisi(null)).toBe(false);
  });

  it("distingue les prestations de décès de l'indemnité de retraite", () => {
    expect(prestationDeDeces("capital_deces")).toBe(true);
    expect(prestationDeDeces("allocation_deces_retraite")).toBe(true);
    expect(prestationDeDeces("indemnite_retraite")).toBe(false);
  });
});

describe("santé", () => {
  it("repère l'origine professionnelle d'un arrêt", () => {
    expect(origineProfessionnelle("accident_travail")).toBe(true);
    expect(origineProfessionnelle("maladie_professionnelle")).toBe(true);
    expect(origineProfessionnelle("maladie")).toBe(false);
    expect(origineProfessionnelle("accident_non_professionnel")).toBe(false);
  });

  it("n'attend une durée que pour les séjours", () => {
    expect(priseEnChargeAvecSejour("hospitalisation")).toBe(true);
    expect(priseEnChargeAvecSejour("evacuation_sanitaire")).toBe(true);
    expect(priseEnChargeAvecSejour("pharmaceutique")).toBe(false);
  });
});

describe("formatMontant", () => {
  it("met en forme un montant en francs, séparateurs compris", () => {
    // `toLocaleString("fr-FR")` sépare les milliers par une espace fine
    // insécable : on la normalise pour que l'attente reste lisible.
    const NARROW_NBSP = " ";
    expect(formatMontant(2000000).split(NARROW_NBSP).join(" ")).toBe("2 000 000 F");
  });

  it("rend un tiret plutôt qu'un zéro trompeur quand le montant manque", () => {
    expect(formatMontant(null)).toBe("—");
    expect(formatMontant(undefined)).toBe("—");
  });

  it("distingue zéro d'une absence de montant", () => {
    expect(formatMontant(0)).not.toBe("—");
  });
});
