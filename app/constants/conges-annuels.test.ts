import { describe, it, expect } from "vitest";
import { STATUTS_CAMPAGNE_CONGE_ANNUEL, STATUTS_REPORT_CONGE_ANNUEL } from "./enums";
import {
  STATUT_CAMPAGNE_COLOR,
  STATUT_CAMPAGNE_LABEL,
  STATUT_REPORT_COLOR,
  STATUT_REPORT_LABEL,
  campagneDeLAnnee,
  estCircuitAnnuel,
  estTypeCongeAnnuel,
  estWeekEnd,
  gereCongeAnnuel,
  libelleTypeDemande,
  origineDepot,
  peutAnnulerCongeAnnuel,
  traitementOuvert,
} from "./conges-annuels";

const roles = (...noms: string[]) => (r: string) => noms.includes(r);

describe("libellés et couleurs", () => {
  it("chaque statut de campagne et de report a une couleur et un libellé", () => {
    for (const s of STATUTS_CAMPAGNE_CONGE_ANNUEL) {
      expect(STATUT_CAMPAGNE_COLOR[s]).toBeTruthy();
      expect(STATUT_CAMPAGNE_LABEL[s]).toBeTruthy();
    }
    for (const s of STATUTS_REPORT_CONGE_ANNUEL) {
      expect(STATUT_REPORT_COLOR[s]).toBeTruthy();
      expect(STATUT_REPORT_LABEL[s]).toBeTruthy();
    }
  });
});

describe("estTypeCongeAnnuel", () => {
  it("reconnaît le type par son nom, sans tenir compte de la casse", () => {
    expect(estTypeCongeAnnuel({ nom: "Congé annuel" })).toBe(true);
    expect(estTypeCongeAnnuel({ nom: "CONGÉ ANNUEL (art. 77)" })).toBe(true);
  });

  it("laisse passer les autres types", () => {
    expect(estTypeCongeAnnuel({ nom: "Congé de maternité" })).toBe(false);
    expect(estTypeCongeAnnuel(null)).toBe(false);
  });
});

describe("estCircuitAnnuel", () => {
  it("une demande avec origine relève de /conges-annuels", () => {
    expect(estCircuitAnnuel({ origine: "campagne" })).toBe(true);
    expect(estCircuitAnnuel({ origine: "apres_cloture" })).toBe(true);
  });

  it("une demande sans origine reste sur /conges", () => {
    expect(estCircuitAnnuel({ origine: null })).toBe(false);
    expect(estCircuitAnnuel({})).toBe(false);
  });
});

describe("gereCongeAnnuel (assertRh côté API)", () => {
  it("rh et admin gèrent la campagne", () => {
    expect(gereCongeAnnuel(roles("rh"))).toBe(true);
    expect(gereCongeAnnuel(roles("admin"))).toBe(true);
  });

  it("un rôle de bureau DRHL ou un chef ne la gère pas (403)", () => {
    expect(gereCongeAnnuel(roles("rh-personnel"))).toBe(false);
    expect(gereCongeAnnuel(roles("chef-service"))).toBe(false);
  });
});

describe("campagneDeLAnnee", () => {
  const campagnes = [
    { id: 1, annee: 2025, statut: "cloturee" as const },
    { id: 2, annee: 2026, statut: "ouverte" as const },
  ];

  it("retrouve la campagne de l'année", () => {
    expect(campagneDeLAnnee(campagnes, 2026)?.id).toBe(2);
  });

  it("null si l'année n'a pas de campagne", () => {
    expect(campagneDeLAnnee(campagnes, 2027)).toBeNull();
  });
});

describe("origineDepot", () => {
  it("campagne ouverte → proposition de campagne", () => {
    expect(origineDepot({ statut: "ouverte" })).toBe("campagne");
  });

  it("campagne clôturée → droit acquis après clôture", () => {
    expect(origineDepot({ statut: "cloturee" })).toBe("apres_cloture");
  });

  it("brouillon ou pas de campagne → aucun dépôt", () => {
    expect(origineDepot({ statut: "brouillon" })).toBeNull();
    expect(origineDepot(null)).toBeNull();
  });
});

describe("traitementOuvert", () => {
  it("une proposition de campagne attend la clôture", () => {
    expect(traitementOuvert({ origine: "campagne" }, { statut: "ouverte" })).toBe(false);
    expect(traitementOuvert({ origine: "campagne" }, null)).toBe(false);
    expect(traitementOuvert({ origine: "campagne" }, { statut: "cloturee" })).toBe(true);
  });

  it("le droit après clôture se traite tout de suite", () => {
    expect(traitementOuvert({ origine: "apres_cloture" }, { statut: "cloturee" })).toBe(true);
  });
});

describe("peutAnnulerCongeAnnuel", () => {
  const proposition = { statut: "soumise" as const, agent_id: 12, origine: "campagne" as const };
  const demandeur = { agent_id: 12, estAdmin: false };

  it("le demandeur annule tant que la campagne est ouverte", () => {
    expect(peutAnnulerCongeAnnuel(proposition, { statut: "ouverte" }, demandeur)).toBe(true);
  });

  it("plus après la clôture (422 côté API)", () => {
    expect(peutAnnulerCongeAnnuel(proposition, { statut: "cloturee" }, demandeur)).toBe(false);
  });

  it("le droit après clôture reste annulable tant que soumis", () => {
    const d = { ...proposition, origine: "apres_cloture" as const };
    expect(peutAnnulerCongeAnnuel(d, { statut: "cloturee" }, demandeur)).toBe(true);
    expect(peutAnnulerCongeAnnuel({ ...d, statut: "validee_n1" }, { statut: "cloturee" }, demandeur)).toBe(false);
  });

  it("un tiers ne peut pas, un admin si", () => {
    expect(peutAnnulerCongeAnnuel(proposition, { statut: "ouverte" }, { agent_id: 7, estAdmin: false })).toBe(false);
    expect(peutAnnulerCongeAnnuel(proposition, { statut: "ouverte" }, { agent_id: null, estAdmin: true })).toBe(true);
  });
});

describe("estWeekEnd", () => {
  it("samedi et dimanche", () => {
    expect(estWeekEnd("2026-10-03")).toBe(true);
    expect(estWeekEnd("2026-10-04")).toBe(true);
  });

  it("jour de semaine ou valeur absente", () => {
    expect(estWeekEnd("2026-10-05")).toBe(false);
    expect(estWeekEnd("")).toBe(false);
    expect(estWeekEnd(undefined)).toBe(false);
  });
});

describe("libelleTypeDemande", () => {
  it("précise le circuit d'un congé annuel", () => {
    expect(libelleTypeDemande({ origine: "campagne", origine_label: null, type_conge: { nom: "Congé annuel" } })).toBe(
      "Congé annuel · Campagne",
    );
  });

  it("laisse les autres demandes telles quelles", () => {
    expect(libelleTypeDemande({ origine: null, type_conge: { nom: "Congé de maternité" } })).toBe("Congé de maternité");
    expect(libelleTypeDemande({ origine: null })).toBe("—");
  });
});
