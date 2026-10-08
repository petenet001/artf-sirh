import { describe, it, expect } from "vitest";
import {
  ENTITE_LABEL,
  estStructurable,
  niveauEntite,
  porteesSession,
  resoudreEntite,
} from "./entite";

const DIRECTION = "App\\Models\\Direction";
const SERVICE = "App\\Models\\Service";
const BUREAU = "App\\Models\\Bureau";

describe("estStructurable", () => {
  it("accepte les trois structures affectables", () => {
    expect(estStructurable(DIRECTION)).toBe(true);
    expect(estStructurable(SERVICE)).toBe(true);
    expect(estStructurable(BUREAU)).toBe(true);
  });

  it("rejette tout autre type", () => {
    expect(estStructurable("App\\Models\\Agent")).toBe(false);
    expect(estStructurable(null)).toBe(false);
  });
});

describe("ENTITE_LABEL", () => {
  it("nomme chaque type de structure", () => {
    expect(ENTITE_LABEL[DIRECTION]).toBe("Direction");
    expect(ENTITE_LABEL[SERVICE]).toBe("Service");
    expect(ENTITE_LABEL[BUREAU]).toBe("Bureau");
  });
});

describe("niveauEntite", () => {
  it("déduit le niveau du rôle de responsable", () => {
    expect(niveauEntite(["directeur-general"])).toBe("artf");
    expect(niveauEntite(["directeur"])).toBe("direction");
    expect(niveauEntite(["chef-service"])).toBe("service");
    expect(niveauEntite(["chef-bureau"])).toBe("bureau");
  });

  it("garde le niveau le plus large quand plusieurs rôles se cumulent", () => {
    // Le directeur DRHL porte aussi le rôle métier `rh`.
    expect(niveauEntite(["rh", "directeur"])).toBe("direction");
    expect(niveauEntite(["chef-bureau", "chef-service"])).toBe("service");
  });

  it("ne donne rien à un compte sans rôle de responsable", () => {
    expect(niveauEntite(["agent"])).toBeNull();
    expect(niveauEntite(["admin", "rh"])).toBeNull();
    expect(niveauEntite([])).toBeNull();
  });
});

describe("porteesSession", () => {
  it("ouvre la portée « entite » aux seuls responsables", () => {
    expect(porteesSession(["directeur", "rh"])).toEqual(["entite"]);
    expect(porteesSession(["rh"])).toEqual([]);
  });
});

describe("resoudreEntite", () => {
  it("donne toute l'ARTF au DG, même sans affectation", () => {
    expect(resoudreEntite(["directeur-general"], null)).toEqual({ etat: "artf" });
  });

  it("retient la structure quand rôle et affectation sont au même niveau", () => {
    expect(resoudreEntite(["directeur", "rh"], { structurable_type: DIRECTION, structurable_id: 4 })).toEqual({
      etat: "structure",
      niveau: "direction",
      type: DIRECTION,
      id: 4,
    });
    expect(resoudreEntite(["chef-bureau"], { structurable_type: BUREAU, structurable_id: 9 })).toMatchObject({
      etat: "structure",
      id: 9,
    });
  });

  it("n'ouvre rien quand rôle et affectation se contredisent", () => {
    expect(resoudreEntite(["chef-bureau"], { structurable_type: DIRECTION, structurable_id: 2 })).toEqual({
      etat: "incoherente",
      niveau: "bureau",
      type: DIRECTION,
      id: 2,
    });
  });

  it("signale un responsable sans affectation active", () => {
    expect(resoudreEntite(["chef-service"], null)).toEqual({ etat: "sans-affectation", niveau: "service" });
    expect(resoudreEntite(["directeur"], { structurable_type: DIRECTION, structurable_id: null })).toEqual({
      etat: "sans-affectation",
      niveau: "direction",
    });
  });

  it("ne résout rien pour un compte sans rôle de responsable", () => {
    expect(resoudreEntite(["agent"], { structurable_type: BUREAU, structurable_id: 1 })).toEqual({ etat: "aucune" });
  });
});
