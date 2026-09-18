import { describe, expect, it } from "vitest";
import { couleurPart, echapperHtml, echelleRonde, formatGraduation, positionSurEchelle } from "./viz";
import { VIZ } from "~/constants/reporting";

describe("echelleRonde", () => {
  it("arrondit le haut de l'échelle à un multiple du pas", () => {
    expect(echelleRonde(42)).toEqual({ borne: 50, pas: 10, graduations: [0, 10, 20, 30, 40, 50] });
  });

  it("garde un maximum déjà rond", () => {
    expect(echelleRonde(20).borne).toBe(20);
  });

  it("ne descend jamais sous un pas de 1", () => {
    expect(echelleRonde(3)).toEqual({ borne: 3, pas: 1, graduations: [0, 1, 2, 3] });
  });

  it("gradue les gros montants avec un pas rond", () => {
    const { pas, borne } = echelleRonde(84_500_000);
    expect(pas).toBe(20_000_000);
    expect(borne).toBe(100_000_000);
  });

  it("préfère la borne la plus serrée", () => {
    expect(echelleRonde(7)).toEqual({ borne: 8, pas: 2, graduations: [0, 2, 4, 6, 8] });
  });

  it("donne une échelle exploitable sans donnée", () => {
    expect(echelleRonde(0)).toEqual({ borne: 1, pas: 1, graduations: [0, 1] });
  });
});

describe("positionSurEchelle", () => {
  it("place la valeur en pourcentage de la borne", () => {
    expect(positionSurEchelle(25, 50)).toBe(50);
  });

  it("borne le résultat entre 0 et 100", () => {
    expect(positionSurEchelle(80, 50)).toBe(100);
    expect(positionSurEchelle(-5, 50)).toBe(0);
    expect(positionSurEchelle(5, 0)).toBe(0);
  });
});

describe("formatGraduation", () => {
  it("écrit les petites valeurs en entier", () => {
    expect(formatGraduation(2500).replace(/\s/g, " ")).toBe("2 500");
  });

  it("compacte les montants", () => {
    expect(formatGraduation(84_500_000).replace(/\s/g, " ")).toBe("84,5 M");
  });
});

describe("couleurPart", () => {
  it("suit l'ordre catégoriel fixe", () => {
    expect(couleurPart({ cle: "F", libelle: "Femmes" }, 0)).toBe(VIZ.categoriel[0]);
    expect(couleurPart({ cle: "M", libelle: "Hommes" }, 1)).toBe(VIZ.categoriel[1]);
  });

  it("réserve le gris à l'absence de donnée", () => {
    expect(couleurPart({ cle: "inconnu", libelle: "Non renseigné" }, 0)).toBe(VIZ.neutre);
  });

  it("ne recycle jamais une teinte au-delà de la palette", () => {
    expect(couleurPart({ cle: "x", libelle: "X" }, 5)).toBe(VIZ.neutre);
  });
});

describe("echapperHtml", () => {
  it("neutralise le balisage d'un libellé", () => {
    expect(echapperHtml(`<img src=x onerror="alert('x')">`)).toBe(
      "&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;",
    );
  });

  it("laisse un libellé ordinaire intact", () => {
    expect(echapperHtml("Congés d'août")).toBe("Congés d&#39;août");
  });
});
