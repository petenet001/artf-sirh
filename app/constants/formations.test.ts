import { describe, it, expect } from "vitest";
import { exigeRapport, planModifiable, prochaineEtapePlan } from "./formations";

describe("exigeRapport (CCN art. 100)", () => {
  it("ne vise que le perfectionnement et la qualification", () => {
    expect(exigeRapport("perfectionnement")).toBe(true);
    expect(exigeRapport("qualification")).toBe(true);
    expect(exigeRapport("seminaire")).toBe(false);
    expect(exigeRapport(null)).toBe(false);
  });
});

describe("cycle du plan annuel", () => {
  it("n'est modifiable qu'en brouillon", () => {
    expect(planModifiable("brouillon")).toBe(true);
    expect(planModifiable("valide")).toBe(false);
    expect(planModifiable("execute")).toBe(false);
  });

  it("enchaîne valider → exécuter → clôturer, puis s'arrête", () => {
    expect(prochaineEtapePlan("brouillon")?.key).toBe("valider");
    expect(prochaineEtapePlan("valide")?.key).toBe("executer");
    expect(prochaineEtapePlan("execute")?.key).toBe("cloturer");
    expect(prochaineEtapePlan("cloture")).toBeNull();
    expect(prochaineEtapePlan(null)).toBeNull();
  });
});
