import { describe, it, expect } from "vitest";
import { STATUTS_AGENT, STATUTS_AGENT_MODIFIABLES } from "./enums";
import {
  STATUT_AGENT_LABEL,
  STATUT_AGENT_COLOR,
  STATUT_AGENT_MODIFIABLE_OPTIONS,
  statutAgentLabel,
  statutAgentColor,
  estStatutAgentModifiable,
} from "./personnel";

describe("statuts agent (CCN art. 76–80)", () => {
  it("couvre les 10 valeurs de StatutAgent avec un libellé et une couleur", () => {
    expect(STATUTS_AGENT).toHaveLength(10);
    for (const s of STATUTS_AGENT) {
      expect(STATUT_AGENT_LABEL[s]).toBeTruthy();
      expect(STATUT_AGENT_COLOR[s]).toBeTruthy();
    }
  });

  it("libellés des positions conventionnelles", () => {
    expect(statutAgentLabel("disponibilite")).toBe("En disponibilité");
    expect(statutAgentLabel("sous_le_drapeau")).toBe("Sous le drapeau");
    expect(statutAgentLabel("detachement")).toBe("En détachement");
  });

  it("replis : valeur inconnue brute, absente = tiret, couleur neutre", () => {
    expect(statutAgentLabel("inconnu")).toBe("inconnu");
    expect(statutAgentLabel(null)).toBe("—");
    expect(statutAgentColor("inconnu")).toBe("neutral");
  });

  it("stagiaire et archive ne sont pas modifiables par le formulaire (422 API)", () => {
    expect(estStatutAgentModifiable("stagiaire")).toBe(false);
    expect(estStatutAgentModifiable("archive")).toBe(false);
    expect(STATUT_AGENT_MODIFIABLE_OPTIONS.map((o) => o.value)).not.toContain("stagiaire");
  });

  it("les positions conventionnelles passent par leur écran, pas par le statut (art. 76–80)", () => {
    // `PUT /integration/agents/{id}` les rejette : 422 « Utiliser POST /carriere/positions ».
    for (const position of ["detachement", "disponibilite", "position_exceptionnelle", "sous_le_drapeau"]) {
      expect(estStatutAgentModifiable(position)).toBe(false);
      expect(STATUT_AGENT_MODIFIABLE_OPTIONS.map((o) => o.value)).not.toContain(position);
    }
    expect(STATUTS_AGENT_MODIFIABLES).toEqual(["actif", "inactif", "suspendu", "retraite"]);
  });
});
