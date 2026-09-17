import { describe, it, expect } from "vitest";
import { actionsLot, formatMontant, validationBloquee } from "./paie";

describe("actionsLot", () => {
  it("ne rend que les actions déclarées par le serveur", () => {
    const lot = {
      actions: { generer: true, controler: true, valider: false, cloturer: false, supprimer: true, exporter: false, modifier: true },
    };
    expect(actionsLot(lot).map((a) => a.key)).toEqual(["generer", "controler", "supprimer"]);
  });

  it("ne rend rien quand le serveur n'autorise rien (lot clôturé)", () => {
    expect(actionsLot({ actions: {} })).toEqual([]);
    expect(actionsLot({})).toEqual([]);
  });

  it("ignore `exporter` et `modifier` : ce ne sont pas des boutons de cycle", () => {
    const lot = { actions: { exporter: true, modifier: true } };
    expect(actionsLot(lot)).toEqual([]);
  });
});

describe("validationBloquee", () => {
  it("bloque dès une anomalie bloquante", () => {
    expect(validationBloquee({ nb_anomalies_bloquantes: 1 })).toBe(true);
    expect(validationBloquee({ nb_anomalies_bloquantes: 0 })).toBe(false);
    expect(validationBloquee({})).toBe(false);
  });
});

describe("formatMontant", () => {
  it("formate en francs, sans décimales", () => {
    expect(formatMontant(1120000)).toMatch(/1\s?120\s?000\sF/u);
    expect(formatMontant(0)).toMatch(/0\sF/u);
  });

  it("rend un tiret pour une valeur absente", () => {
    expect(formatMontant(null)).toBe("—");
    expect(formatMontant(undefined)).toBe("—");
  });
});
