import { describe, it, expect } from "vitest";
import { STATUTS_DEMANDE_CONGE } from "./enums";
import { STATUT_DEMANDE_COLOR, STATUT_DEMANDE_LABEL, estCongeAccorde, peutAnnulerConge } from "./conges";

const type = (flags: { n1?: boolean; rh?: boolean; dg?: boolean }) => ({
  id: 1,
  nom: "Type",
  necessite_n1: flags.n1 ?? false,
  necessite_rh: flags.rh ?? false,
  necessite_dg: flags.dg ?? false,
});

describe("statuts de demande", () => {
  it("chaque statut (dont annulee) a une couleur et un libellé", () => {
    for (const s of STATUTS_DEMANDE_CONGE) {
      expect(STATUT_DEMANDE_COLOR[s]).toBeTruthy();
      expect(STATUT_DEMANDE_LABEL[s]).toBeTruthy();
    }
    expect(STATUT_DEMANDE_LABEL.annulee).toBe("Annulée");
  });
});

describe("estCongeAccorde (miroir de TypeConge::estAccordee)", () => {
  it("type N+1 seul : accordé dès validee_n1", () => {
    expect(estCongeAccorde({ statut: "validee_n1", prochaine_etape: null, type_conge: type({ n1: true }) })).toBe(true);
  });

  it("type N+1 → RH : validee_n1 ne suffit pas, validee_rh oui", () => {
    const t = type({ n1: true, rh: true });
    expect(estCongeAccorde({ statut: "validee_n1", prochaine_etape: "valider-rh", type_conge: t })).toBe(false);
    expect(estCongeAccorde({ statut: "validee_rh", prochaine_etape: null, type_conge: t })).toBe(true);
  });

  it("type avec DG : seul validee_dg accorde", () => {
    const t = type({ n1: true, rh: true, dg: true });
    expect(estCongeAccorde({ statut: "validee_rh", prochaine_etape: null, type_conge: t })).toBe(false);
    expect(estCongeAccorde({ statut: "validee_dg", prochaine_etape: null, type_conge: t })).toBe(true);
  });

  it("rejetée ou annulée : jamais accordée", () => {
    expect(estCongeAccorde({ statut: "rejetee_rh", prochaine_etape: null, type_conge: type({ rh: true }) })).toBe(false);
    expect(estCongeAccorde({ statut: "annulee", prochaine_etape: null, type_conge: type({ n1: true }) })).toBe(false);
  });

  it("sans type chargé : repli sur validee_rh / validee_dg", () => {
    expect(estCongeAccorde({ statut: "validee_dg", prochaine_etape: null })).toBe(true);
    expect(estCongeAccorde({ statut: "validee_n1", prochaine_etape: null })).toBe(false);
  });
});

describe("peutAnnulerConge", () => {
  const demande = { statut: "soumise" as const, agent_id: 12 };

  it("le demandeur peut retirer sa demande soumise", () => {
    expect(peutAnnulerConge(demande, { agent_id: 12, estAdmin: false })).toBe(true);
  });

  it("un tiers ne le peut pas, un admin si", () => {
    expect(peutAnnulerConge(demande, { agent_id: 7, estAdmin: false })).toBe(false);
    expect(peutAnnulerConge(demande, { agent_id: null, estAdmin: false })).toBe(false);
    expect(peutAnnulerConge(demande, { agent_id: null, estAdmin: true })).toBe(true);
  });

  it("plus possible une fois le circuit engagé", () => {
    expect(peutAnnulerConge({ statut: "validee_n1", agent_id: 12 }, { agent_id: 12, estAdmin: false })).toBe(false);
  });
});
