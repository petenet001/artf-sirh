import { describe, it, expect } from "vitest";
import { notificationLink, notificationDomaineMeta } from "./notifications";

describe("notificationLink", () => {
  it("congé : lien vers le détail de la demande (demande_id)", () => {
    expect(notificationLink({ domaine: "conge", data: { demande_id: 4 } })).toBe("/conges/demandes/4");
    expect(notificationLink({ domaine: "conge", data: { demande_id: "4" } })).toBe("/conges/demandes/4");
  });

  it("congé sans identifiant : pas de lien", () => {
    expect(notificationLink({ domaine: "conge", data: { agent_id: 12 } })).toBeUndefined();
  });

  it("absence : lien vers la liste des absences", () => {
    expect(notificationLink({ domaine: "absence", data: { absence_id: 3 } })).toBe("/conges/absences");
  });

  it("domaines existants inchangés, domaine inconnu sans lien", () => {
    expect(notificationLink({ domaine: "affectation", data: { affectation_id: 9 } })).toBe("/carriere/affectations/9");
    expect(notificationLink({ domaine: "inconnu", data: {} })).toBeUndefined();
  });
});

describe("notificationDomaineMeta", () => {
  it("repli neutre pour un domaine inconnu", () => {
    expect(notificationDomaineMeta("conge").label).toBe("Congé");
    expect(notificationDomaineMeta("xyz").icon).toBe("i-lucide-bell");
  });
});
